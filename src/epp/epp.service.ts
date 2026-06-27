import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { EppPdfService } from '../pdf/epp-pdf.service';
import { UsersService } from '../users/users.service';
import { CreateEppDto } from './dto/create-epp.dto';

export interface EppEntity {
  id: string;
  numero: number;
  empresa: string;
  trabajador: { nombre: string; rut: string; cargo: string; usuarioId: string };
  fecha: string;
  items: { epp: string; marca: string; cant: number; talla: string; fecha: string }[];
  entregadoPor: { nombre: string; rut: string; rol: string };
  estado: string;
  firma: string;
  fechaFirma: string;
  urlPdf: string;
  createdAt: string;
}

const SHEET = 'EPP';
const HEADERS = [
  'id', 'numero', 'empresa', 'trabajador', 'fecha',
  'items', 'entregadoPor', 'estado', 'firma', 'fechaFirma', 'urlPdf', 'createdAt',
];

@Injectable()
export class EppService {
  constructor(
    private sheets: GoogleSheetsService,
    private pdfService: EppPdfService,
    private usersService: UsersService,
  ) {}

  private parse(row: Record<string, string>): EppEntity {
    return {
      ...row,
      numero: Number(row.numero) || 0,
      trabajador: this.tryParse(row.trabajador, {}),
      items: this.tryParse(row.items, []),
      entregadoPor: this.tryParse(row.entregadoPor, {}),
    } as unknown as EppEntity;
  }

  private tryParse(val: string, fallback: any): any {
    try { return JSON.parse(val); } catch { return fallback; }
  }

  private serialize(e: EppEntity): Record<string, any> {
    return {
      ...e,
      trabajador: JSON.stringify(e.trabajador),
      items: JSON.stringify(e.items),
      entregadoPor: JSON.stringify(e.entregadoPor),
    };
  }

  private async getAll(): Promise<EppEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async create(dto: CreateEppDto, usuarioId: string): Promise<EppEntity> {
    const user = await this.usersService.findOne(usuarioId);
    const all = await this.getAll();
    const numero = all.length + 1;

    const entregadoPor = { nombre: `${user.name} ${user.lastName}`, rut: user.rut, rol: user.rol };
    const epp: EppEntity = {
      id: this.sheets.generateId(),
      numero,
      empresa: user.empresa,
      trabajador: dto.trabajador as any,
      fecha: dto.fecha,
      items: (dto.items ?? []) as any,
      entregadoPor,
      estado: 'pendiente',
      firma: '',
      fechaFirma: '',
      urlPdf: '',
      createdAt: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET, HEADERS, this.serialize(epp));

    // Generar PDF en segundo plano
    this.generarYGuardarPdf(epp).catch(err => console.error('[EPP] Error generando PDF:', err));

    return epp;
  }

  private async generarYGuardarPdf(epp: EppEntity): Promise<void> {
    const url = await this.pdfService.generateEppPdf(
      this.buildDatos(epp),
      epp.entregadoPor?.nombre ?? '',
      this.buildFileName(epp),
    );
    const updated: EppEntity = { ...epp, urlPdf: url };
    await this.sheets.dbUpdate(SHEET, epp.id, HEADERS, this.serialize(updated));
  }

  async findAll(): Promise<EppEntity[]> {
    return (await this.getAll()).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }

  async findOne(id: string): Promise<EppEntity> {
    const all = await this.getAll();
    const epp = all.find(e => e.id === id);
    if (!epp) throw new NotFoundException('EPP no encontrado');
    return epp;
  }

  async findMisPendientes(usuarioId: string): Promise<EppEntity[]> {
    const all = await this.getAll();
    return all
      .filter(e => e.trabajador?.usuarioId === usuarioId && e.estado === 'pendiente')
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }

  async firmar(id: string, usuarioId: string): Promise<EppEntity> {
    const epp = await this.findOne(id);
    if (epp.estado === 'firmado') throw new ForbiddenException('Este EPP ya fue firmado');

    const user = await this.usersService.findOne(usuarioId);
    if (!user.signature) throw new ForbiddenException('El usuario no tiene firma guardada');

    const updated: EppEntity = {
      ...epp,
      firma: user.signature,
      estado: 'firmado',
      fechaFirma: new Date().toISOString(),
    };

    const url = await this.pdfService.generateEppPdf(
      this.buildDatos(updated),
      updated.entregadoPor?.nombre ?? 'USUARIO',
      this.buildFileName(updated),
    );
    updated.urlPdf = url;

    await this.sheets.dbUpdate(SHEET, id, HEADERS, this.serialize(updated));
    return updated;
  }

  async regenerarPdf(id: string): Promise<EppEntity> {
    const epp = await this.findOne(id);
    const url = await this.pdfService.generateEppPdf(
      this.buildDatos(epp),
      epp.entregadoPor?.nombre ?? 'USUARIO',
      this.buildFileName(epp),
    );
    const updated: EppEntity = { ...epp, urlPdf: url };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, this.serialize(updated));
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.sheets.dbDelete(SHEET, id);
    return { message: 'EPP eliminado correctamente' };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private buildDatos(epp: EppEntity): any {
    return {
      empresa:        epp.empresa,
      nombre:         epp.trabajador?.nombre ?? '',
      numero:         String(epp.numero ?? ''),
      cargo:          epp.trabajador?.cargo ?? '',
      rut:            epp.trabajador?.rut ?? '',
      fecha:          epp.fecha ?? '',
      firma:          epp.firma || null,
      elementos:      (epp.items ?? []).map((item: any) => ({
        epp:      item.epp ?? '',
        marca:    item.marca ?? '',
        cant:     String(item.cant ?? ''),
        talla:    item.talla ?? '',
        fecha:    item.fecha ?? '',
        recambio: '',
      })),
      entregadoPor:   epp.entregadoPor?.nombre ?? '',
      entregadoRut:   epp.entregadoPor?.rut ?? '',
      entregadoCargo: epp.entregadoPor?.rol ?? '',
    };
  }

  private buildFileName(epp: EppEntity): string {
    const nombre = (epp.trabajador?.nombre ?? 'Trabajador')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')
      .substring(0, 40);
    const fecha = String(epp.fecha ?? '').replace(/\//g, '-');
    const empresa = (epp.empresa ?? 'drs').toUpperCase();
    return `EPP_${nombre}_${fecha}_${empresa}.pdf`;
  }
}
