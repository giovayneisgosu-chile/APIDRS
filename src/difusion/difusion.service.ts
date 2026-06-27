import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { DifusionPdfService } from '../pdf/difusion-pdf.service';
import { UsersService } from '../users/users.service';
import { CreateDifusionDto } from './dto/create-difusion.dto';

export enum EstadoDifusion {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADO = 'completado',
}

export interface DifusionEntity {
  id: string;
  creadoPor: string;
  fecha: string;
  temaPrincipal: string;
  relator: string;
  rutRelator: string;
  cargo: string;
  tipoActividad: string;
  modalidad: string;
  asistencia: string;
  ubicacion: string;
  horaInicio: string;
  horaTermino: string;
  duracion: string;
  hhTotales: string;
  firmaRelator: string;
  estado: string;
  participantes: string; // JSON
  urlPdfDrs: string;
  urlPdfFda: string;
  createdAt: string;
}

const SHEET = 'Difusion';
const HEADERS = [
  'id', 'creadoPor', 'fecha', 'temaPrincipal', 'relator',
  'rutRelator', 'cargo', 'tipoActividad', 'modalidad', 'asistencia',
  'ubicacion', 'horaInicio', 'horaTermino', 'duracion', 'hhTotales',
  'firmaRelator', 'estado', 'participantes', 'urlPdfDrs', 'urlPdfFda', 'createdAt',
];

@Injectable()
export class DifusionService {
  constructor(
    private sheets: GoogleSheetsService,
    private pdfService: DifusionPdfService,
    private usersService: UsersService,
  ) {}

  private tryParse(val: string, fallback: any = []): any {
    try { return JSON.parse(val); } catch { return fallback; }
  }

  private parse(row: Record<string, string>): DifusionEntity {
    return { ...row } as unknown as DifusionEntity;
  }

  private async getAll(): Promise<DifusionEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  private expand(d: DifusionEntity, creadoPor?: any): any {
    return {
      id: d.id, _id: d.id,
      creadoPor: creadoPor ?? d.creadoPor,
      fecha: d.fecha,
      temaPrincipal: d.temaPrincipal, relator: d.relator,
      rutRelator: d.rutRelator, cargo: d.cargo,
      tipoActividad: d.tipoActividad, modalidad: d.modalidad,
      asistencia: d.asistencia, ubicacion: d.ubicacion,
      horaInicio: d.horaInicio, horaTermino: d.horaTermino,
      duracion: d.duracion, hhTotales: d.hhTotales,
      firmaRelator: d.firmaRelator, estado: d.estado,
      participantes: this.tryParse(d.participantes),
      urlPdfDrs: d.urlPdfDrs, urlPdfFda: d.urlPdfFda,
      createdAt: d.createdAt,
    };
  }

  private async populateUser(userId: string): Promise<any> {
    try {
      const u = await this.usersService.findOne(userId);
      return { id: u.id, name: u.name, lastName: u.lastName, email: u.email };
    } catch { return { id: userId }; }
  }

  async create(dto: CreateDifusionDto, userId: string): Promise<any> {
    const difusion: DifusionEntity = {
      id: this.sheets.generateId(),
      creadoPor: userId,
      fecha: dto.fecha ?? '',
      temaPrincipal: dto.temaPrincipal ?? '',
      relator: dto.relator ?? '',
      rutRelator: dto.rutRelator ?? '',
      cargo: dto.cargo ?? '',
      tipoActividad: dto.tipoActividad ?? '',
      modalidad: dto.modalidad ?? '',
      asistencia: dto.asistencia ?? '',
      ubicacion: dto.ubicacion ?? '',
      horaInicio: dto.horaInicio ?? '',
      horaTermino: dto.horaTermino ?? '',
      duracion: dto.duracion ?? '',
      hhTotales: dto.hhTotales ?? '',
      firmaRelator: dto.firmaRelator ?? '',
      estado: EstadoDifusion.PENDIENTE,
      participantes: JSON.stringify(dto.participantes ?? []),
      urlPdfDrs: '',
      urlPdfFda: '',
      createdAt: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET, HEADERS, difusion);

    this.generarYGuardarPdfs(difusion).catch(() => null);

    return this.expand(difusion);
  }

  private async generarYGuardarPdfs(difusion: DifusionEntity): Promise<void> {
    const expanded = this.expand(difusion);
    const urls = await this.pdfService.generarPdfs(expanded);
    const updated: DifusionEntity = { ...difusion, urlPdfDrs: urls.urlDrs ?? '', urlPdfFda: urls.urlFda ?? '' };
    await this.sheets.dbUpdate(SHEET, difusion.id, HEADERS, updated);
  }

  async firmar(id: string, userId: string): Promise<any> {
    const difusion = await this.getById(id);
    const usuario = await this.usersService.findOne(userId);

    const participantes: any[] = this.tryParse(difusion.participantes).map((p: any) => {
      if (p.usuarioId === userId) {
        return { ...p, firmado: true, firma: usuario.signature, fechaFirma: new Date().toISOString() };
      }
      return p;
    });

    const todosFirmaron = participantes.every(p => p.firmado);
    const algunoFirmo   = participantes.some(p => p.firmado);
    const estado = todosFirmaron
      ? EstadoDifusion.COMPLETADO
      : algunoFirmo ? EstadoDifusion.EN_PROCESO : EstadoDifusion.PENDIENTE;

    const updated: DifusionEntity = { ...difusion, participantes: JSON.stringify(participantes), estado };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, updated);

    if (todosFirmaron) this.generarYGuardarPdfs(updated).catch(() => null);

    return this.expand(updated);
  }

  async regenerarPdfs(id: string): Promise<{ urlPdfDrs?: string; urlPdfFda?: string }> {
    const difusion = await this.getById(id);
    const expanded = this.expand(difusion);
    const urls = await this.pdfService.generarPdfs(expanded);
    const updated: DifusionEntity = { ...difusion, urlPdfDrs: urls.urlDrs ?? '', urlPdfFda: urls.urlFda ?? '' };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, updated);
    return { urlPdfDrs: urls.urlDrs, urlPdfFda: urls.urlFda };
  }

  async findAll(filters: { userId?: string; estado?: string; empresa?: string }): Promise<any[]> {
    let all = await this.getAll();
    if (filters.userId)  all = all.filter(d => d.creadoPor === filters.userId);
    if (filters.estado)  all = all.filter(d => d.estado === filters.estado);
    if (filters.empresa) {
      all = all.filter(d => {
        const parts = this.tryParse(d.participantes);
        return parts.some((p: any) => (p.empresa ?? '').toLowerCase().includes(filters.empresa!.toLowerCase()));
      });
    }
    all = all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    return Promise.all(all.map(async d => {
      const user = await this.populateUser(d.creadoPor);
      return this.expand(d, user);
    }));
  }

  async findMisPendientes(userId: string): Promise<any[]> {
    const all = await this.getAll();
    return all
      .filter(d => {
        if (d.estado === EstadoDifusion.COMPLETADO) return false;
        const parts = this.tryParse(d.participantes);
        return parts.some((p: any) => p.usuarioId === userId && !p.firmado);
      })
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .map(d => this.expand(d));
  }

  async findOne(id: string): Promise<any> {
    const d = await this.getById(id);
    const user = await this.populateUser(d.creadoPor);
    return this.expand(d, user);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.sheets.dbDelete(SHEET, id);
  }

  private async getById(id: string): Promise<DifusionEntity> {
    const all = await this.getAll();
    const d = all.find(x => x.id === id);
    if (!d) throw new NotFoundException('Difusión no encontrada');
    return d;
  }
}
