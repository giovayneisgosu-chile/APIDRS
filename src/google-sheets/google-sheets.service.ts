import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { randomUUID } from 'crypto';

@Injectable()
export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;
  private sheetIdCache = new Map<string, number>();

  private static normalizePem(pem: string): string {
    const match = pem.match(/-----BEGIN ([A-Z ]+)-----\s*([\s\S]+?)\s*-----END ([A-Z ]+)-----/);
    if (!match) return pem;
    const body = match[2].replace(/\s+/g, '');
    const wrapped = body.match(/.{1,64}/g)!.join('\n');
    return `-----BEGIN ${match[1]}-----\n${wrapped}\n-----END ${match[3]}-----\n`;
  }

  constructor(private config: ConfigService) {
    const clientEmail = config.get<string>('GOOGLE_CLIENT_EMAIL');
    const rawKey = config.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n') ?? '';
    const privateKey = rawKey ? GoogleSheetsService.normalizePem(rawKey) : undefined;
    this.spreadsheetId = config.get<string>('GOOGLE_SHEETS_ID') ?? '';

    if (!clientEmail || !privateKey) return;

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  generateId(): string {
    return randomUUID();
  }

  // ── Core helpers ─────────────────────────────────────────────

  private async getRawRows(sheetName: string): Promise<{ headers: string[]; rows: string[][] }> {
    if (!this.sheets) return { headers: [], rows: [] };
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
      });
      const all: string[][] = res.data.values ?? [];
      if (!all.length) return { headers: [], rows: [] };
      const [headers, ...rows] = all;
      return { headers, rows };
    } catch {
      return { headers: [], rows: [] };
    }
  }

  private toObject(headers: string[], row: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj;
  }

  private toRow(headers: string[], data: Record<string, any>): string[] {
    return headers.map(h => {
      const v = data[h];
      if (v === undefined || v === null) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
  }

  private async getSheetId(sheetName: string): Promise<number | null> {
    if (this.sheetIdCache.has(sheetName)) return this.sheetIdCache.get(sheetName)!;
    try {
      const res = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      for (const s of res.data.sheets ?? []) {
        this.sheetIdCache.set(s.properties.title, s.properties.sheetId);
      }
    } catch { /* ignore */ }
    return this.sheetIdCache.get(sheetName) ?? null;
  }

  // ── Generic DB CRUD ──────────────────────────────────────────
  //
  // Estructura esperada en cada pestaña de Google Sheets:
  //   Fila 1 = encabezados (ej: id | name | email | ...)
  //   Fila 2+ = datos
  //
  // Pestañas requeridas:
  //   Usuarios      : id, name, lastName, rut, email, password, phone, rol, empresa, signature, isActive, createdAt
  //   Productos     : id, nombre, categoria, talla, stock
  //   Inventario    : id, categoria, producto, talla, stock
  //   Vehiculos     : patente, kilometrajeActual, proximaMantencion, ultimaActualizacion
  //   EPP           : id, numero, empresa, trabajador, fecha, items, entregadoPor, estado, firma, fechaFirma, urlPdf, createdAt
  //   ART           : id, creadoPor, empresa, fecha, supervisorAsignador, trabajoARealizar, lugarEspecifico, liderNombre, data, urlPdf, numeroDia, createdAt
  //   Difusion      : id, creadoPor, empresa, fecha, temaPrincipal, relator, rutRelator, cargo, tipoActividad, modalidad, asistencia, ubicacion, horaInicio, horaTermino, duracion, hhTotales, firmaRelator, estado, participantes, urlPdfDrs, urlPdfFda, createdAt
  //   Checklist     : id, creadoPor, fecha, nombre, run, patente, empresa, data, urlPdf, createdAt, kilometraje

  async dbGetAll(sheetName: string): Promise<Record<string, string>[]> {
    const { headers, rows } = await this.getRawRows(sheetName);
    if (!headers.length) return [];
    return rows
      .filter(r => r.some(c => c !== ''))
      .map(r => this.toObject(headers, r));
  }

  private async ensureSheet(sheetName: string, headers: string[]): Promise<void> {
    if (!this.sheets) return;
    const existingId = await this.getSheetId(sheetName);
    if (existingId !== null) return;

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    });
    this.sheetIdCache.delete(sheetName);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }

  private async syncHeaders(sheetName: string, headers: string[]): Promise<void> {
    const { headers: current } = await this.getRawRows(sheetName);
    if (current.length >= headers.length) return;
    // Solo agrega columnas nuevas al final — nunca reordena
    const lastCol = String.fromCharCode(65 + headers.length - 1);
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1:${lastCol}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }

  async dbAppend(sheetName: string, headers: string[], data: Record<string, any>): Promise<void> {
    if (!this.sheets) return;
    await this.ensureSheet(sheetName, headers);
    await this.syncHeaders(sheetName, headers);
    const row = this.toRow(headers, data);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  }

  async dbUpdate(sheetName: string, id: string, headers: string[], data: Record<string, any>): Promise<boolean> {
    if (!this.sheets) return false;
    const { rows } = await this.getRawRows(sheetName);
    const idx = rows.findIndex(r => r[0] === id);
    if (idx === -1) return false;
    const rowNum = idx + 2;
    const lastCol = String.fromCharCode(65 + headers.length - 1);
    const row = this.toRow(headers, data);
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A${rowNum}:${lastCol}${rowNum}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
    return true;
  }

  async dbDelete(sheetName: string, id: string): Promise<boolean> {
    if (!this.sheets) return false;
    const { rows } = await this.getRawRows(sheetName);
    const idx = rows.findIndex(r => r[0] === id);
    if (idx === -1) return false;
    const sheetId = await this.getSheetId(sheetName);
    if (sheetId === null) return false;
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: idx + 1, // 0-indexed; +1 porque fila 0 = encabezados
              endIndex: idx + 2,
            },
          },
        }],
      },
    });
    return true;
  }
}
