import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { CreateInventarioDto, AjustarStockDto } from './dto/inventario.dto';

export interface InventarioEntity {
  id: string;
  categoria: string;
  producto: string;
  talla: string;
  stock: number;
}

const SHEET = 'Inventario';
const HEADERS = ['id', 'categoria', 'producto', 'talla', 'stock'];

@Injectable()
export class InventarioService {
  constructor(private sheets: GoogleSheetsService) {}

  private parse(row: Record<string, string>): InventarioEntity {
    return { ...row, stock: Number(row.stock) || 0 } as unknown as InventarioEntity;
  }

  private async getAll(): Promise<InventarioEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async create(dto: CreateInventarioDto): Promise<InventarioEntity> {
    const item: InventarioEntity = {
      id: this.sheets.generateId(),
      categoria: dto.categoria,
      producto: dto.producto,
      talla: dto.talla ?? '',
      stock: dto.stock ?? 0,
    };
    await this.sheets.dbAppend(SHEET, HEADERS, item);
    return item;
  }

  async findAll(categoria?: string, producto?: string): Promise<InventarioEntity[]> {
    let all = await this.getAll();
    if (categoria) all = all.filter(i => i.categoria.toLowerCase().includes(categoria.toLowerCase()));
    if (producto)  all = all.filter(i => i.producto.toLowerCase().includes(producto.toLowerCase()));
    return all.sort((a, b) =>
      a.categoria.localeCompare(b.categoria) ||
      a.producto.localeCompare(b.producto) ||
      (a.talla ?? '').localeCompare(b.talla ?? ''),
    );
  }

  async findCategorias(): Promise<string[]> {
    const all = await this.getAll();
    return [...new Set(all.map(i => i.categoria))].sort();
  }

  async findOne(id: string): Promise<InventarioEntity> {
    const all = await this.getAll();
    const item = all.find(i => i.id === id);
    if (!item) throw new NotFoundException('Producto no encontrado');
    return item;
  }

  async update(id: string, dto: Partial<CreateInventarioDto>): Promise<InventarioEntity> {
    const current = await this.findOne(id);
    const updated: InventarioEntity = { ...current, ...(dto as any), id };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, updated);
    return updated;
  }

  async ajustarStock(id: string, dto: AjustarStockDto): Promise<InventarioEntity> {
    const current = await this.findOne(id);
    const nuevoStock = current.stock + dto.cantidad;
    if (nuevoStock < 0) throw new BadRequestException('Stock insuficiente');
    const updated: InventarioEntity = { ...current, stock: nuevoStock };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, updated);
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.sheets.dbDelete(SHEET, id);
    return { message: 'Producto eliminado' };
  }
}
