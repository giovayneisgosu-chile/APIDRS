import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';

const SHEET = 'Reporte Inspeccion POD';
const HEADERS = [
  'id', 'fecha', 'responsable', 'responsableEmail',
  'avanceFisico', 'dotacion', 'actividades',
  'equipos', 'muestras', 'noConformidades', 'incidentes',
  'fotosUrls', 'createdAt',
];

export interface FotoActividad {
  actividadIndex: number;
  descripcion: string;
  base64: string;
  mimeType: string;
}

export interface ActividadReporte {
  nPod: string;
  trisemanal: string;
  areaTrabajo: string;
  descripcionItem: string;
  unidad: string;
  cantidadProgramada: string;
  cantidadProyectadaDia: string;
  empresaInspeccionada: string;
  disciplina: string;
  cantEjecutada: string;
  cantPlan3W: string;
  cnc: string;
  cantRemanentes: string;
  cumplePIE: string;
  cumpleEETT: string;
  obsAlerta: string;
  obsAlertaPyC: string;
  fotosUrls: string[];
}

export interface CreateReportePodDto {
  fecha: string;
  responsable: string;
  avanceFisico: string;
  dotacion: {
    indirectos: { contrato: string; cantPersonal: string; he: string }[];
    directos: { contrato: string; cantPersonal: string; he: string }[];
  };
  actividades: ActividadReporte[];
  equipos: { equipo: string; pbc01: string; operativos: string; enMantencion: string; contrato: string; observacion: string }[];
  muestras: { disciplina: string; empresaInspeccionada: string; tipoMuestra: string; observaciones: string }[];
  noConformidades: { empresa: string; tipoDoc: string; descripcion: string }[];
  incidentes: { empresa: string; tipoReporte: string; descripcion: string }[];
  fotos: FotoActividad[];
}

@Injectable()
export class ReportePodService {
  constructor(
    private sheets: GoogleSheetsService,
    private drive: GoogleDriveService,
  ) {}

  async create(dto: CreateReportePodDto, responsableEmail: string): Promise<any> {
    const nombreNorm = dto.responsable
      .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '-').toUpperCase();

    // Subir fotos a Drive
    const fotosSubidas: { actividadIndex: number; descripcion: string; url: string }[] = [];
    for (const foto of dto.fotos ?? []) {
      try {
        const buffer = Buffer.from(foto.base64, 'base64');
        const ext = foto.mimeType.includes('png') ? 'png' : 'jpg';
        const fileName = `POD-${nombreNorm}-${dto.fecha.replace(/\//g, '-')}-act${foto.actividadIndex}-${fotosSubidas.length + 1}.${ext}`;
        const url = await this.drive.subirArchivo(
          buffer,
          `ReportePOD/${nombreNorm}`,
          fileName,
          foto.mimeType,
        );
        fotosSubidas.push({ actividadIndex: foto.actividadIndex, descripcion: foto.descripcion, url });
      } catch (err) {
        console.error('[ReportePOD] Error subiendo foto:', err);
      }
    }

    // Asignar URLs a actividades
    const actividadesConFotos = dto.actividades.map((act, idx) => ({
      ...act,
      fotosUrls: fotosSubidas.filter(f => f.actividadIndex === idx).map(f => f.url),
    }));

    const reporte = {
      id: this.sheets.generateId(),
      fecha: dto.fecha,
      responsable: dto.responsable,
      responsableEmail,
      avanceFisico: dto.avanceFisico ?? '',
      dotacion: JSON.stringify(dto.dotacion),
      actividades: JSON.stringify(actividadesConFotos),
      equipos: JSON.stringify(dto.equipos ?? []),
      muestras: JSON.stringify(dto.muestras ?? []),
      noConformidades: JSON.stringify(dto.noConformidades ?? []),
      incidentes: JSON.stringify(dto.incidentes ?? []),
      fotosUrls: JSON.stringify(fotosSubidas),
      createdAt: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET, HEADERS, reporte);
    return { ...reporte, fotosSubidas };
  }

  async findAll(): Promise<any[]> {
    const rows = await this.sheets.dbGetAll(SHEET);
    return rows
      .map(r => ({
        ...r,
        dotacion: this.tryParse(r.dotacion, {}),
        actividades: this.tryParse(r.actividades, []),
        equipos: this.tryParse(r.equipos, []),
        muestras: this.tryParse(r.muestras, []),
        noConformidades: this.tryParse(r.noConformidades, []),
        incidentes: this.tryParse(r.incidentes, []),
        fotosUrls: this.tryParse(r.fotosUrls, []),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByResponsable(responsable: string): Promise<any[]> {
    const all = await this.findAll();
    return all.filter(r => r.responsable?.toLowerCase() === responsable.toLowerCase());
  }

  private tryParse(val: string, fallback: any): any {
    try { return JSON.parse(val); } catch { return fallback; }
  }
}
