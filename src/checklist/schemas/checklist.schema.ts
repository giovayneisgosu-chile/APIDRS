import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChecklistDocument = HydratedDocument<Checklist>;

@Schema({ timestamps: true, collection: 'checklists' })
export class Checklist {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) creadoPor: Types.ObjectId;
  @Prop({ default: null }) urlPdf: string;

  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  run: string;

  @Prop({ required: true, trim: true, uppercase: true })
  patente: string;

  @Prop({ required: true })
  kilometraje: string;

  @Prop({ default: '' })
  nivelCombustible: string;

  @Prop({ default: '' })
  equipoCritico: string;

  @Prop({ default: '' })
  alertaDetencion: string;

  @Prop({ default: '' })
  presentaAnomalias: string;

  @Prop({ type: [String], default: [] })
  equipamientoMalEstado: string[];

  @Prop({ default: '' })
  observacionesEquipo: string;

  @Prop({ default: '' })
  camaraExternaPosicion: string;

  @Prop({ default: '' })
  camaraExternaLimpia: string;

  @Prop({ default: '' })
  camaraInternaPosicion: string;

  @Prop({ default: '' })
  camaraInternaLimpia: string;

  @Prop({ default: '' })
  camaraRetrocesoPosicion: string;

  @Prop({ default: '' })
  camaraRetrocesoLimpia: string;

  @Prop({ default: '' })
  dispositivosFatiga: string;

  @Prop({ type: [String], default: [] })
  kitSeguridad: string[];

  @Prop({ default: '' })
  observacionesKit: string;

  @Prop({ default: '' })
  tieneDocumentacion: string;

  @Prop({ default: '' })
  observacionesDocumentacion: string;

  @Prop({ default: '' })
  tieneLicencia: string;

  @Prop({ default: '' })
  observacionesLicencia: string;

  @Prop({ default: '' })
  tratamientoMedico: string;

  @Prop({ default: '' })
  cualTratamiento: string;

  @Prop({ default: '' })
  suenoEventoNocturno: string;

  @Prop({ default: '' })
  suenoInsomnio: string;

  @Prop({ default: '' })
  suenoPocasDurmiendo: string;

  @Prop({ default: '' })
  suenoMedicamento: string;

  @Prop({ default: '' })
  suenoEnfermedad: string;

  @Prop({ default: '' })
  suenoFactoresExternos: string;

  @Prop({ default: '' })
  suenoEventosSomnolencia: string;

  @Prop({ default: '' })
  verificacionPernos: string;

  @Prop({ default: '' })
  observacionesEnRevision: string;

  @Prop({ default: '' })
  observacionesNeumaticos: string;

  @Prop({ default: '' })
  usuarioNombre: string;
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);
