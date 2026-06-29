import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';

const SHEET_PLAN = 'Planificacion';
const SHEET_EJEC = 'Ejecucion';

const HEADERS_EJEC = [
  'id', 'fecha', 'especialidad', 'responsable',
  'nPod', 'areaTrabajo', 'descripcionItem', 'unidad',
  'cantidadProgramada', 'cantidadEjecutada', 'porcentaje',
  'observacion', 'restriccion', 'fotoUrl', 'creadoEn',
];

export interface ActividadPlanificada {
  especialidad: string;
  nPod: string;
  trisemanal: string;
  fecha: string;
  responsable: string;
  areaTrabajo: string;
  descripcionItem: string;
  unidad: string;
  cantidadProgramada: string;
  cantidadProyectadaDia: string;
  restricciones: string;
}

export interface RegistrarEjecucionDto {
  fecha: string;
  especialidad: string;
  responsable: string;
  nPod: string;
  areaTrabajo: string;
  descripcionItem: string;
  unidad: string;
  cantidadProgramada: string;
  cantidadEjecutada: string;
  porcentaje: string;
  observacion: string;
  restriccion: string;
  imagenBase64?: string;
  imagenMimeType?: string;
}

@Injectable()
export class PlanificacionService {
  constructor(
    private sheets: GoogleSheetsService,
    private drive: GoogleDriveService,
  ) {}

  private mapActividad(r: Record<string, string>): ActividadPlanificada {
    return {
      especialidad: r['ESPECIALIDAD'] ?? r['especialidad'] ?? '',
      nPod: r['N° POD'] ?? r['nPod'] ?? '',
      trisemanal: r['TRISEMANAL / COLCHÓN'] ?? r['trisemanal'] ?? '',
      fecha: r['Fecha'] ?? r['fecha'] ?? '',
      responsable: r['Responsable'] ?? r['responsable'] ?? '',
      areaTrabajo: r['Área de trabajo'] ?? r['areaTrabajo'] ?? '',
      descripcionItem: r['Descripción Ítem'] ?? r['descripcionItem'] ?? '',
      unidad: r['Unidad'] ?? r['unidad'] ?? '',
      cantidadProgramada: r['Cantidad Programada'] ?? r['cantidadProgramada'] ?? '',
      cantidadProyectadaDia: r['Cantidad Proyectada Día'] ?? r['cantidadProyectadaDia'] ?? '',
      restricciones: r['Restricciones'] ?? r['restricciones'] ?? '',
    };
  }

  async getActividades(especialidad: string, fecha?: string): Promise<ActividadPlanificada[]> {
    const rows = await this.sheets.dbGetAll(SHEET_PLAN);
    return rows
      .filter(r => {
        const matchEsp = (r['ESPECIALIDAD'] ?? r['especialidad'] ?? '').toUpperCase() === especialidad.toUpperCase();
        if (!matchEsp) return false;
        if (fecha) return (r['Fecha'] ?? r['fecha'] ?? '') === fecha;
        return true;
      })
      .map(r => this.mapActividad(r));
  }

  async getActividadesPorResponsable(responsable: string, fecha?: string): Promise<ActividadPlanificada[]> {
    const rows = await this.sheets.dbGetAll(SHEET_PLAN);
    return rows
      .filter(r => {
        const resp = (r['Responsable'] ?? r['responsable'] ?? '').trim().toLowerCase();
        if (resp !== responsable.trim().toLowerCase()) return false;
        if (fecha) return (r['Fecha'] ?? r['fecha'] ?? '') === fecha;
        return true;
      })
      .map(r => this.mapActividad(r));
  }

  async registrarEjecucion(dto: RegistrarEjecucionDto): Promise<any> {
    let fotoUrl = '';

    if (dto.imagenBase64 && dto.imagenMimeType) {
      const buffer = Buffer.from(dto.imagenBase64, 'base64');
      const ext = dto.imagenMimeType.includes('png') ? 'png' : 'jpg';
      const nombre = String(dto.responsable)
        .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '-').toUpperCase();
      const fileName = `EJEC-${nombre}-${dto.fecha.replace(/\//g, '-')}-${Date.now()}.${ext}`;
      fotoUrl = await this.drive.subirArchivo(
        buffer,
        `Ejecucion/${dto.especialidad.toUpperCase()}`,
        fileName,
        dto.imagenMimeType,
      );
    }

    const registro = {
      id: this.sheets.generateId(),
      fecha: dto.fecha,
      especialidad: dto.especialidad,
      responsable: dto.responsable,
      nPod: dto.nPod,
      areaTrabajo: dto.areaTrabajo,
      descripcionItem: dto.descripcionItem,
      unidad: dto.unidad,
      cantidadProgramada: dto.cantidadProgramada,
      cantidadEjecutada: dto.cantidadEjecutada,
      porcentaje: dto.porcentaje,
      observacion: dto.observacion,
      restriccion: dto.restriccion,
      fotoUrl,
      creadoEn: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET_EJEC, HEADERS_EJEC, registro);
    return registro;
  }

  async getEjecucion(especialidad?: string, fecha?: string): Promise<any[]> {
    const rows = await this.sheets.dbGetAll(SHEET_EJEC);
    return rows.filter(r => {
      if (especialidad && (r.especialidad ?? '').toUpperCase() !== especialidad.toUpperCase()) return false;
      if (fecha && r.fecha !== fecha) return false;
      return true;
    });
  }
}
