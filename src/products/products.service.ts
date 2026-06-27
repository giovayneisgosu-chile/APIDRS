import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { CreateProductDto } from './dto/create-product.dto';

export interface ProductEntity {
  id: string;
  nombre: string;
  categoria: string;
  talla: string;
  stock: number;
}

const SHEET = 'Productos';
const HEADERS = ['id', 'nombre', 'categoria', 'talla', 'stock'];

@Injectable()
export class ProductsService {
  constructor(private sheets: GoogleSheetsService) {}

  private parse(row: Record<string, string>): ProductEntity {
    return { ...row, stock: Number(row.stock) || 0 } as unknown as ProductEntity;
  }

  private async getAll(): Promise<ProductEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async create(dto: CreateProductDto): Promise<ProductEntity> {
    const product: ProductEntity = {
      id: this.sheets.generateId(),
      nombre: dto.nombre,
      categoria: dto.categoria,
      talla: dto.talla ?? '',
      stock: dto.stock ?? 0,
    };
    await this.sheets.dbAppend(SHEET, HEADERS, product);
    return product;
  }

  async findAll(): Promise<ProductEntity[]> {
    return this.getAll();
  }

  async findOne(id: string): Promise<ProductEntity | null> {
    const all = await this.getAll();
    return all.find(p => p.id === id) ?? null;
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<ProductEntity | null> {
    const all = await this.getAll();
    const current = all.find(p => p.id === id);
    if (!current) throw new NotFoundException('Producto no encontrado');
    const updated: ProductEntity = { ...current, ...(dto as any), id };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, updated);
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const all = await this.getAll();
    if (!all.find(p => p.id === id)) throw new NotFoundException('Producto no encontrado');
    await this.sheets.dbDelete(SHEET, id);
    return { message: 'Producto eliminado' };
  }
}
