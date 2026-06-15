import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DifusionDocument = Difusion & Document;

export enum EstadoDifusion {
  PENDIENTE   = 'pendiente',
  EN_PROCESO  = 'en_proceso',
  COMPLETADO  = 'completado',
}

export class ParticipanteDifusion {
  @Prop() usuarioId: string;
  @Prop() nombre: string;
  @Prop() rut: string;
  @Prop() cargo: string;
  @Prop() proyecto: string;
  @Prop() empresa: string;
  @Prop({ default: false }) firmado: boolean;
  @Prop() firma: string;
  @Prop() fechaFirma: string;
}

@Schema({ timestamps: true, collection: 'difusiones' })
export class Difusion {
  @Prop({ required: true }) tipoActividad: string;
  @Prop({ required: true }) modalidad: string;
  @Prop({ required: true }) asistencia: string;
  @Prop({ required: true }) relator: string;
  @Prop({ required: true }) rutRelator: string;
  @Prop({ required: true }) cargo: string;
  @Prop({ required: true }) ubicacion: string;
  @Prop({ required: true }) temaPrincipal: string;
  @Prop({ required: true }) fecha: string;
  @Prop({ required: true }) horaInicio: string;
  @Prop({ required: true }) horaTermino: string;
  @Prop({ required: true }) duracion: string;
  @Prop({ required: true }) hhTotales: string;
  @Prop() firmaRelator: string;

  @Prop({ type: [Object], default: [] }) participantes: ParticipanteDifusion[];

  @Prop({ default: EstadoDifusion.PENDIENTE }) estado: EstadoDifusion;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) creadoPor: Types.ObjectId;

  @Prop() urlPdfDrs: string;
  @Prop() urlPdfFda: string;
}

export const DifusionSchema = SchemaFactory.createForClass(Difusion);
