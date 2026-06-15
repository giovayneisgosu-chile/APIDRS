import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor(private config: ConfigService) {
    const clientEmail = config.get<string>('GOOGLE_CLIENT_EMAIL');
    const privateKey   = config.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    this.spreadsheetId = config.get<string>('GOOGLE_SHEETS_ID') ?? '';

    if (!clientEmail || !privateKey) return;

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  private async append(range: string, values: any[][]): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    } catch {
      // No interrumpir el flujo principal si Sheets falla
    }
  }

  async agregarEpp(datos: {
    fecha: string; numero: string; trabajador: string;
    rut: string; cargo: string; empresa: string; estado: string; urlPdf: string;
  }): Promise<void> {
    await this.append('EPP!A:H', [[
      datos.fecha, datos.numero, datos.trabajador, datos.rut,
      datos.cargo, datos.empresa, datos.estado,
      datos.urlPdf ? `=HYPERLINK("${datos.urlPdf}";"Ver PDF")` : '',
    ]]);
  }

  async agregarDifusion(datos: {
    fecha: string; tema: string; relator: string; empresa: string;
    participantes: number; estado: string; urlDrs: string; urlFda: string;
  }): Promise<void> {
    await this.append('Difusion!A:H', [[
      datos.fecha, datos.tema, datos.relator, datos.empresa,
      datos.participantes, datos.estado,
      datos.urlDrs ? `=HYPERLINK("${datos.urlDrs}";"Ver PDF DRS")` : '',
      datos.urlFda ? `=HYPERLINK("${datos.urlFda}";"Ver PDF FDA")` : '',
    ]]);
  }

  async agregarArt(datos: {
    fecha: string; supervisor: string; empresa: string;
    trabajo: string; lugar: string; lider: string; urlPdf: string;
  }): Promise<void> {
    await this.append('ART!A:G', [[
      datos.fecha, datos.supervisor, datos.empresa,
      datos.trabajo, datos.lugar, datos.lider,
      datos.urlPdf ? `=HYPERLINK("${datos.urlPdf}";"Ver PDF")` : '',
    ]]);
  }

  async agregarChecklist(datos: {
    fecha: string; nombre: string; run: string; patente: string;
    kilometraje: string; nivelCombustible: string; equipoCritico: string;
    dispositivosFatiga: string; tieneDocumentacion: string;
    tieneLicencia: string; verificacionPernos: string;
  }): Promise<void> {
    await this.append('CheckList!A:K', [[
      datos.fecha, datos.nombre, datos.run, datos.patente,
      datos.kilometraje, datos.nivelCombustible, datos.equipoCritico,
      datos.dispositivosFatiga, datos.tieneDocumentacion,
      datos.tieneLicencia, datos.verificacionPernos,
    ]]);
  }
}
