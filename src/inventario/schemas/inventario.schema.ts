import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventarioDocument = HydratedDocument<Inventario>;

@Schema({ timestamps: true, collection: 'inventario' })
export class Inventario {
  @Prop({ required: true, trim: true })
  categoria: string;

  @Prop({ required: true, trim: true })
  producto: string;

  @Prop({ type: String, default: null, trim: true })
  talla: string | null;

  @Prop({ required: true, default: 0, min: 0 })
  stock: number;
}

export const InventarioSchema = SchemaFactory.createForClass(Inventario);

InventarioSchema.index({ categoria: 1, producto: 1, talla: 1 }, { unique: true });
