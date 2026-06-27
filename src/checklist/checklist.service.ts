import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';

export interface ChecklistEntity {
  id: string;
  creadoPor: string;
  fecha: string;
  nombre: string;
  run: string;
  patente: string;
  empresa: string;
  kilometraje: string;
  data: string;
  urlPdf: string;
  createdAt: string;
}

const SHEET = 'Checklist';
const HEADERS = ['id', 'creadoPor', 'fecha', 'nombre', 'run', 'patente', 'empresa', 'data', 'urlPdf', 'createdAt', 'kilometraje'];

@Injectable()
export class ChecklistService {
  constructor(
    private sheets: GoogleSheetsService,
    private drive: GoogleDriveService,
  ) {}

  private tryParse(val: string, fallback: any = {}): any {
    try { return JSON.parse(val); } catch { return fallback; }
  }

  private parse(row: Record<string, string>): ChecklistEntity {
    return { ...row } as unknown as ChecklistEntity;
  }

  private expand(c: ChecklistEntity, creadoPor?: any): any {
    const data = this.tryParse(c.data);
    return {
      id: c.id, _id: c.id,
      creadoPor: creadoPor ?? c.creadoPor,
      urlPdf: c.urlPdf,
      createdAt: c.createdAt,
      ...data,
    };
  }

  private async getAll(): Promise<ChecklistEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async create(rawData: any, pdfBuffer?: Buffer, userId?: string): Promise<any> {
    // Cuando viene como FormData, los campos llegan como string JSON en rawData.data
    const data = typeof rawData?.data === 'string' ? JSON.parse(rawData.data) : rawData;
    const checklist: ChecklistEntity = {
      id: this.sheets.generateId(),
      creadoPor: userId ?? '',
      fecha: data.fecha ?? new Date().toLocaleDateString('es-CL'),
      nombre: data.nombre ?? '',
      run: data.run ?? '',
      patente: (data.patente ?? '').toUpperCase(),
      empresa: data.empresa ?? '',
      kilometraje: data.kilometraje ?? '',
      data: JSON.stringify(data),
      urlPdf: '',
      createdAt: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET, HEADERS, checklist);

    if (pdfBuffer) {
      const fileName = `CheckList_${(data.nombre ?? 'conductor').replace(/\s+/g, '_')}_${checklist.fecha}.pdf`;
      const urlPdf = await this.drive.subirPdf(pdfBuffer, 'checklists', fileName);
      const updated: ChecklistEntity = { ...checklist, urlPdf };
      await this.sheets.dbUpdate(SHEET, checklist.id, HEADERS, updated);
      return this.expand(updated);
    }

    return this.expand(checklist);
  }

  async findAll(): Promise<any[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .map(c => this.expand(c));
  }

  async findByPatente(patente: string): Promise<any[]> {
    const all = await this.getAll();
    return all
      .filter(c => c.patente === patente.toUpperCase())
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .map(c => this.expand(c));
  }

  async findByUsuario(userId: string): Promise<any[]> {
    const all = await this.getAll();
    return all
      .filter(c => c.creadoPor === userId)
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .map(c => this.expand(c));
  }

  async contarPorUsuario(userId: string): Promise<{ total: number }> {
    const all = await this.getAll();
    return { total: all.filter(c => c.creadoPor === userId).length };
  }
}
