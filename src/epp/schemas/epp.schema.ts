import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EppDocument = HydratedDocument<Epp>;

export class ItemEpp {
  epp: string;
  marca: string;
  cant: number;
  talla: string;
  fecha: string;
}

export class TrabajadorEpp {
  nombre: string;
  rut: string;
  cargo: string;
  usuarioId: string;
}

export class EntregadoPor {
  nombre: string;
  rut: string;
  rol: string;
}

@Schema({ timestamps: true, collection: 'epps' })
export class Epp {
  @Prop({ required: true })
  numero: number;

  @Prop({ required: true, lowercase: true })
  empresa: string;

  @Prop({ required: true, type: Object })
  trabajador: TrabajadorEpp;

  @Prop({ required: true })
  fecha: string;

  @Prop({ type: [Object], default: [] })
  items: ItemEpp[];

  @Prop({ required: true, type: Object })
  entregadoPor: EntregadoPor;

  @Prop({ default: 'pendiente' })
  estado: string;

  @Prop({ default: null })
  firma: string;

  @Prop({ default: null })
  fechaFirma: Date;

  @Prop({ default: null })
  urlPdf: string;
}

export const EppSchema = SchemaFactory.createForClass(Epp);
