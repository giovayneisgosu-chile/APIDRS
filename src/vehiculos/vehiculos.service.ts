import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { UpdateKilometrajeDto, UpdateMantencionDto } from './dto/update-vehiculo.dto';
import { CreateMantencionDto } from './dto/create-mantencion.dto';

export interface VehiculoEntity {
  patente: string;
  kilometrajeActual: number;
  proximaMantencion: number;
  ultimaActualizacion: string;
}

export interface MantencionEntity {
  id: string;
  patente: string;
  numeroFactura: string;
  fecha: string;
  proximaMantencion: number;
  valorNeto: number;
  contrato: string;
  imagenUrl: string;
  createdAt: string;
}

const SHEET = 'Vehiculos';
const HEADERS = ['patente', 'kilometrajeActual', 'proximaMantencion', 'ultimaActualizacion'];

const SHEET_MANT = 'Mantenciones';
const HEADERS_MANT = ['id', 'patente', 'numeroFactura', 'fecha', 'proximaMantencion', 'valorNeto', 'contrato', 'imagenUrl', 'createdAt'];

@Injectable()
export class VehiculosService {
  constructor(
    private sheets: GoogleSheetsService,
    private drive: GoogleDriveService,
  ) {}

  private parse(row: Record<string, string>): VehiculoEntity {
    return {
      ...row,
      kilometrajeActual: Number(row.kilometrajeActual) || 0,
      proximaMantencion: Number(row.proximaMantencion) || 0,
    } as unknown as VehiculoEntity;
  }

  private async getAll(): Promise<VehiculoEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async findAll(): Promise<VehiculoEntity[]> {
    return (await this.getAll()).sort((a, b) => a.patente.localeCompare(b.patente));
  }

  async updateKilometraje(patente: string, dto: UpdateKilometrajeDto): Promise<VehiculoEntity> {
    const upper = patente.toUpperCase();
    const all = await this.getAll();
    const existing = all.find(v => v.patente === upper);
    const updated: VehiculoEntity = {
      patente: upper,
      kilometrajeActual: dto.kilometraje,
      proximaMantencion: Number(existing?.proximaMantencion) || 0,
      ultimaActualizacion: dto.fecha ?? new Date().toLocaleDateString('es-CL'),
    };
    if (existing) {
      await this.sheets.dbUpdate(SHEET, upper, HEADERS, updated);
    } else {
      await this.sheets.dbAppend(SHEET, HEADERS, updated);
    }
    return updated;
  }

  async subirMantencion(patente: string, dto: CreateMantencionDto): Promise<MantencionEntity> {
    const upper = patente.toUpperCase();

    let imagenUrl = '';
    if (dto.imagenBase64 && dto.imagenMimeType) {
      const buffer = Buffer.from(dto.imagenBase64, 'base64');
      const ext = dto.imagenMimeType.includes('png') ? 'png' : 'jpg';
      const fecha = dto.fecha.replace(/\//g, '-');
      const fileName = `${upper}-MANTENCION-${fecha}.${ext}`;
      imagenUrl = await this.drive.subirArchivo(buffer, `Mantenciones/${upper}`, fileName, dto.imagenMimeType);
    }

    const mantencion: MantencionEntity = {
      id: this.sheets.generateId(),
      patente: upper,
      numeroFactura: dto.numeroFactura,
      fecha: dto.fecha,
      proximaMantencion: dto.proximaMantencion,
      valorNeto: dto.valorNeto,
      contrato: dto.contrato,
      imagenUrl,
      createdAt: new Date().toISOString(),
    };

    await this.sheets.dbAppend(SHEET_MANT, HEADERS_MANT, mantencion);
    await this.updateMantencion(upper, { proximaMantencion: dto.proximaMantencion });

    return mantencion;
  }

  async updateMantencion(patente: string, dto: UpdateMantencionDto): Promise<VehiculoEntity> {
    const upper = patente.toUpperCase();
    const all = await this.getAll();
    const existing = all.find(v => v.patente === upper);
    const updated: VehiculoEntity = {
      patente: upper,
      kilometrajeActual: existing?.kilometrajeActual ?? 0,
      proximaMantencion: dto.proximaMantencion,
      ultimaActualizacion: existing?.ultimaActualizacion ?? '',
    };
    if (existing) {
      await this.sheets.dbUpdate(SHEET, upper, HEADERS, updated);
    } else {
      await this.sheets.dbAppend(SHEET, HEADERS, updated);
    }
    return updated;
  }
}
