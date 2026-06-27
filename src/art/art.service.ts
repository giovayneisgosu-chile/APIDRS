import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { ArtPdfPlantillaService } from '../pdf/art-pdf-plantilla.service';
import { UsersService } from '../users/users.service';
import { CreateArtDto } from './dto/create-art.dto';

export interface ArtEntity {
  id: string;
  creadoPor: string;
  empresa: string;
  fecha: string;
  supervisorAsignador: string;
  trabajoARealizar: string;
  lugarEspecifico: string;
  liderNombre: string;
  data: string; // JSON con el resto de los campos del DTO
  urlPdf: string;
  numeroDia: number;
  createdAt: string;
}

const SHEET = 'ART';
const HEADERS = [
  'id', 'creadoPor', 'empresa', 'fecha',
  'supervisorAsignador', 'trabajoARealizar', 'lugarEspecifico', 'liderNombre',
  'data', 'urlPdf', 'numeroDia', 'createdAt',
];

@Injectable()
export class ArtService {
  constructor(
    private sheets: GoogleSheetsService,
    private pdfService: ArtPdfPlantillaService,
    private usersService: UsersService,
  ) {}

  private parse(row: Record<string, string>): ArtEntity {
    return { ...row, numeroDia: Number(row.numeroDia) || 1 } as unknown as ArtEntity;
  }

  private serialize(a: ArtEntity): Record<string, any> {
    return { ...a };
  }

  private async getAll(): Promise<ArtEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  private expand(art: ArtEntity, creadoPor?: any): any {
    const data = this.tryParse(art.data);
    return {
      id: art.id, _id: art.id,
      creadoPor: creadoPor ?? art.creadoPor,
      empresa: art.empresa,
      fecha: art.fecha,
      supervisorAsignador: art.supervisorAsignador,
      trabajoARealizar: art.trabajoARealizar,
      lugarEspecifico: art.lugarEspecifico,
      liderNombre: art.liderNombre,
      urlPdf: art.urlPdf,
      numeroDia: art.numeroDia,
      createdAt: art.createdAt,
      ...data,
    };
  }

  private tryParse(val: string, fallback: any = {}): any {
    try { return JSON.parse(val); } catch { return fallback; }
  }

  private async populateUser(userId: string): Promise<any> {
    try {
      const u = await this.usersService.findOne(userId);
      return { id: u.id, name: u.name, lastName: u.lastName, email: u.email };
    } catch { return { id: userId }; }
  }

  async create(dto: CreateArtDto, userId: string): Promise<any> {
    const all = await this.getAll();
    const numeroDia = all.filter(a => a.creadoPor === userId && a.fecha === dto.fecha).length + 1;

    const otrosRiesgos = (dto.otrosRiesgos ?? []).map(({ riesgo, medidaControl }) => ({ riesgo, medidaControl }));
    const participantes = (dto.participantes ?? []).map(({ nombre, cargo, enCondiciones, firma }) => ({ nombre, cargo, enCondiciones, firma }));
    // Para Sheets: sin firmas base64 (evitar límite 50k chars por celda)
    const participantesSheets = participantes.map(({ nombre, cargo, enCondiciones }) => ({ nombre, cargo, enCondiciones }));

    const art: ArtEntity = {
      id: this.sheets.generateId(),
      creadoPor: userId,
      empresa: dto.empresa ?? '',
      fecha: dto.fecha ?? '',
      supervisorAsignador: dto.supervisorAsignador ?? '',
      trabajoARealizar: dto.trabajoARealizar ?? '',
      lugarEspecifico: dto.lugarEspecifico ?? '',
      liderNombre: dto.liderNombre ?? '',
      data: JSON.stringify({ ...dto, otrosRiesgos, participantes: participantesSheets }),
      urlPdf: '',
      numeroDia,
      createdAt: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET, HEADERS, this.serialize(art));

    try {
      await this.generarYGuardarPdf(art, userId, participantes);
      const updated = await this.getById(art.id);
      return this.expand(updated);
    } catch {
      return this.expand(art);
    }
  }

  private async generarYGuardarPdf(art: ArtEntity, userId: string, participantesConFirmas?: any[]): Promise<void> {
    const usuario = await this.usersService.findOne(userId).catch(() => null);
    if (!usuario) return;
    const userName = `${usuario.name} ${usuario.lastName}`;
    const expanded = this.expand(art);
    if (participantesConFirmas) expanded.participantes = participantesConFirmas;
    const urlPdf = await this.pdfService.generateArtPdf(expanded, userName);
    const updated: ArtEntity = { ...art, urlPdf };
    await this.sheets.dbUpdate(SHEET, art.id, HEADERS, this.serialize(updated));
  }

  async regenerarPdf(id: string, userId: string): Promise<{ urlPdf: string }> {
    const art = await this.getById(id);
    const usuario = await this.usersService.findOne(userId);
    const userName = `${usuario.name} ${usuario.lastName}`;
    const expanded = this.expand(art);
    const urlPdf = await this.pdfService.generateArtPdf(expanded, userName);
    const updated: ArtEntity = { ...art, urlPdf };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, this.serialize(updated));
    return { urlPdf };
  }

  async findAll(filters: {
    userId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    empresa?: string;
    superintendencia?: string;
  }): Promise<any[]> {
    let all = await this.getAll();
    if (filters.userId) all = all.filter(a => a.creadoPor === filters.userId);
    if (filters.empresa) all = all.filter(a => a.empresa.toLowerCase().includes(filters.empresa!.toLowerCase()));
    if (filters.fechaDesde) all = all.filter(a => a.fecha >= filters.fechaDesde!);
    if (filters.fechaHasta) all = all.filter(a => a.fecha <= filters.fechaHasta!);
    if (filters.superintendencia) {
      all = all.filter(a => {
        const data = this.tryParse(a.data);
        return (data.superintendencia ?? '').toLowerCase().includes(filters.superintendencia!.toLowerCase());
      });
    }

    all = all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    return Promise.all(all.map(async a => {
      const user = await this.populateUser(a.creadoPor);
      return this.expand(a, user);
    }));
  }

  async findOne(id: string): Promise<any> {
    const art = await this.getById(id);
    const user = await this.populateUser(art.creadoPor);
    return this.expand(art, user);
  }

  async getStats(filters: { fechaDesde?: string; fechaHasta?: string }): Promise<any> {
    let all = await this.getAll();
    if (filters.fechaDesde) all = all.filter(a => a.fecha >= filters.fechaDesde!);
    if (filters.fechaHasta) all = all.filter(a => a.fecha <= filters.fechaHasta!);

    const total = all.length;

    // Agrupar por usuario
    const byUser = new Map<string, { total: number; ultima: string }>();
    for (const a of all) {
      const prev = byUser.get(a.creadoPor);
      if (prev) { prev.total++; if (a.fecha > prev.ultima) prev.ultima = a.fecha; }
      else byUser.set(a.creadoPor, { total: 1, ultima: a.fecha });
    }
    const porUsuario = await Promise.all(
      [...byUser.entries()].map(async ([uid, s]) => {
        const u = await this.populateUser(uid);
        return { nombre: u.name ? `${u.name} ${u.lastName}` : uid, email: u.email ?? '', ...s };
      }),
    );
    porUsuario.sort((a, b) => b.total - a.total);

    // Agrupar por empresa
    const byEmpresa = new Map<string, number>();
    for (const a of all) byEmpresa.set(a.empresa, (byEmpresa.get(a.empresa) ?? 0) + 1);
    const porEmpresa = [...byEmpresa.entries()]
      .map(([_id, total]) => ({ _id, total }))
      .sort((a, b) => b.total - a.total);

    return { total, porUsuario, porEmpresa };
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.getById(id);
    await this.sheets.dbDelete(SHEET, id);
    return { message: 'ART eliminada' };
  }

  private async getById(id: string): Promise<ArtEntity> {
    const all = await this.getAll();
    const art = all.find(a => a.id === id);
    if (!art) throw new NotFoundException('ART no encontrada');
    return art;
  }
}
