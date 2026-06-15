import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventario, InventarioDocument } from './schemas/inventario.schema';
import { CreateInventarioDto, AjustarStockDto } from './dto/inventario.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectModel(Inventario.name) private inventarioModel: Model<InventarioDocument>,
  ) {}

  async create(dto: CreateInventarioDto): Promise<Inventario> {
    return this.inventarioModel.create({
      ...dto,
      talla: dto.talla || null,
    });
  }

  async findAll(categoria?: string, producto?: string): Promise<Inventario[]> {
    const filtro: any = {};
    if (categoria) filtro.categoria = { $regex: categoria, $options: 'i' };
    if (producto)  filtro.producto  = { $regex: producto,  $options: 'i' };
    return this.inventarioModel.find(filtro).sort({ categoria: 1, producto: 1, talla: 1 }).exec();
  }

  async findCategorias(): Promise<string[]> {
    return this.inventarioModel.distinct('categoria').exec();
  }

  async findOne(id: string): Promise<Inventario> {
    const item = await this.inventarioModel.findById(id).exec();
    if (!item) throw new NotFoundException('Producto no encontrado');
    return item;
  }

  async update(id: string, dto: Partial<CreateInventarioDto>): Promise<Inventario> {
    const item = await this.inventarioModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!item) throw new NotFoundException('Producto no encontrado');
    return item;
  }

  async ajustarStock(id: string, dto: AjustarStockDto): Promise<Inventario> {
    const item = await this.inventarioModel.findById(id).exec();
    if (!item) throw new NotFoundException('Producto no encontrado');
    const nuevoStock = item.stock + dto.cantidad;
    if (nuevoStock < 0) throw new BadRequestException('Stock insuficiente');
    item.stock = nuevoStock;
    return item.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.inventarioModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Producto no encontrado');
    return { message: 'Producto eliminado' };
  }
}
