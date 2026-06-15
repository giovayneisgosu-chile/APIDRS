import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VehiculoDocument = HydratedDocument<Vehiculo>;

@Schema({ timestamps: true, collection: 'vehiculos' })
export class Vehiculo {
  @Prop({ required: true, trim: true, uppercase: true, unique: true })
  patente: string;

  @Prop({ default: 0 })
  kilometrajeActual: number;

  @Prop({ default: null })
  proximaMantencion: number | null;

  @Prop({ default: null })
  ultimaActualizacion: string | null;
}

export const VehiculoSchema = SchemaFactory.createForClass(Vehiculo);
