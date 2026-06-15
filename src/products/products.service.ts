import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create(dto);
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).exec();
  }

  async update(
    id: string,
    dto: Partial<CreateProductDto>,
  ): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async remove(id: string): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
