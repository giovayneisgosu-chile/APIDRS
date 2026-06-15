import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'productos' })
export class Product {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  categoria: string;

  @Prop({ required: true, trim: true })
  talla: string;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
