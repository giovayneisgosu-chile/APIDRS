import { Injectable } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

const SHEET = 'Inspeccion Semanal Camionetas';
const HEADERS = ['id', 'patente', 'realizadoPor', 'realizadoPorEmail', 'fecha', 'items', 'observaciones', 'tieneNoOk', 'createdAt'];

export const CATEGORIAS_INSPECCION = [
  {
    categoria: 'Documentación',
    items: [
      'Permiso de circulación vigente',
      'Revisión técnica al día',
      'SOAP vigente',
      'Padrón a bordo',
      'Licencia del conductor (clase y vigencia)',
      'Acreditación/credencial de faena',
    ],
  },
  {
    categoria: 'Luces y señalización',
    items: [
      'Altas y bajas',
      'Luces de freno (pare)',
      'Direccionales',
      'Luz de retroceso',
      'Neblineros',
      'Baliza giratoria operativa',
      'Pértiga con bandera y luz',
      'Alarma de retroceso',
      'Bocina',
    ],
  },
  {
    categoria: 'Neumáticos',
    items: [
      'Estado y presión (4 + repuesto)',
      'Pernos/tuercas apretados',
      'Profundidad de banda de rodadura',
    ],
  },
  {
    categoria: 'Frenos',
    items: [
      'Freno de servicio',
      'Freno de mano/estacionamiento',
    ],
  },
  {
    categoria: 'Niveles y fluidos',
    items: [
      'Aceite motor',
      'Refrigerante',
      'Líquido de frenos',
      'Agua limpiaparabrisas',
      'Combustible',
    ],
  },
  {
    categoria: 'Visibilidad',
    items: [
      'Parabrisas sin trizaduras',
      'Espejos (2 laterales + interior)',
      'Plumillas limpiaparabrisas',
    ],
  },
  {
    categoria: 'Elementos de seguridad a bordo',
    items: [
      'Cinturones de seguridad (todos)',
      'Extintor cargado y vigente',
      'Botiquín',
      'Triángulos o conos',
      'Cuñas/calzos',
      'Chaleco reflectante',
      'Gata y llave de rueda',
      'Kit antiderrames (si aplica)',
    ],
  },
  {
    categoria: 'Estado general',
    items: [
      'Carrocería sin daños relevantes',
      'Puertas y cierres ok',
      'Asientos en buen estado',
      'Tablero sin testigos encendidos',
      'Barra antivuelco o cubre pickup (si aplica)',
      'Limpieza general',
    ],
  },
];

export interface ItemInspeccion {
  item: string;
  categoria: string;
  estado: 'ok' | 'no_ok' | null;
  observacion: string;
}

export interface InspeccionEntity {
  id: string;
  patente: string;
  realizadoPor: string;
  realizadoPorEmail: string;
  fecha: string;
  items: ItemInspeccion[];
  observaciones: string;
  tieneNoOk: boolean;
  createdAt: string;
}

@Injectable()
export class InspeccionService {
  constructor(private sheets: GoogleSheetsService) {}

  private tryParse(val: string, fallback: any): any {
    try { return JSON.parse(val); } catch { return fallback; }
  }

  private parse(row: Record<string, string>): InspeccionEntity {
    return {
      ...row,
      items: this.tryParse(row.items, []),
      tieneNoOk: row.tieneNoOk === 'true',
    } as unknown as InspeccionEntity;
  }

  private serialize(e: InspeccionEntity): Record<string, any> {
    return {
      ...e,
      items: JSON.stringify(e.items),
      tieneNoOk: String(e.tieneNoOk),
    };
  }

  private async getAll(): Promise<InspeccionEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async create(dto: {
    patente: string;
    realizadoPor: string;
    realizadoPorEmail: string;
    items: ItemInspeccion[];
    observaciones?: string;
  }): Promise<InspeccionEntity> {
    const tieneNoOk = dto.items.some(i => i.estado === 'no_ok');
    const inspeccion: InspeccionEntity = {
      id: this.sheets.generateId(),
      patente: dto.patente.toUpperCase(),
      realizadoPor: dto.realizadoPor,
      realizadoPorEmail: dto.realizadoPorEmail,
      fecha: new Date().toLocaleDateString('es-CL'),
      items: dto.items,
      observaciones: dto.observaciones ?? '',
      tieneNoOk,
      createdAt: new Date().toISOString(),
    };
    await this.sheets.dbAppend(SHEET, HEADERS, this.serialize(inspeccion));
    return inspeccion;
  }

  async findAll(): Promise<InspeccionEntity[]> {
    return (await this.getAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByPatente(patente: string): Promise<InspeccionEntity[]> {
    const all = await this.getAll();
    return all
      .filter(i => i.patente === patente.toUpperCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getEstadoFlota(): Promise<{ patente: string; diasDesdeInspeccion: number | null; tieneNoOk: boolean; ultimaInspeccion: string | null; realizadoPor: string | null }[]> {
    const all = await this.getAll();
    const vehiculos = await this.sheets.dbGetAll('Vehiculos');
    const patentes = vehiculos.map(v => v.patente ?? '').filter(Boolean);

    return patentes.map(patente => {
      const inspecciones = all
        .filter(i => i.patente === patente)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      if (inspecciones.length === 0) {
        return { patente, diasDesdeInspeccion: null, tieneNoOk: false, ultimaInspeccion: null, realizadoPor: null };
      }

      const ultima = inspecciones[0];
      const diff = Date.now() - new Date(ultima.createdAt).getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

      return {
        patente,
        diasDesdeInspeccion: dias,
        tieneNoOk: ultima.tieneNoOk,
        ultimaInspeccion: ultima.fecha,
        realizadoPor: ultima.realizadoPor,
      };
    });
  }

  getCategorias() {
    return CATEGORIAS_INSPECCION;
  }
}
