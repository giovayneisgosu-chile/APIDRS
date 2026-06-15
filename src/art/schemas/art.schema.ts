import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ArtDocument = HydratedDocument<Art>;

@Schema({ timestamps: true, collection: 'arts' })
export class Art {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creadoPor: Types.ObjectId;

  @Prop({ default: null })
  urlPdf: string;

  @Prop({ default: 1 })
  numeroDia: number;

  // ─── PASO 1 — Planificación ───────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  supervisorAsignador: string;

  @Prop({ required: true, trim: true })
  empresa: string;

  @Prop({ required: true, trim: true })
  gerencia: string;

  @Prop({ required: true, trim: true })
  superintendencia: string;

  @Prop({ required: true })
  fecha: string;

  @Prop({ required: true })
  horaInicio: string;

  @Prop({ required: true })
  horaTermino: string;

  @Prop({ required: true, trim: true })
  lugarEspecifico: string;

  @Prop({ required: true, trim: true })
  trabajoARealizar: string;

  // ─── PASO 2A — Supervisor ─────────────────────────────────────────────────
  @Prop({ required: true, enum: ['si', 'no'] })
  supTieneEstandar: string;

  @Prop({ default: '' })
  supNombreEstandar: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  supPersonalCapacitado: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  supSolicitoPermisos: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  supVerificoSegregacion: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  supPersonalComunicacion: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  supPersonalEPP: string;

  // ─── PASO 2A — Trabajador ─────────────────────────────────────────────────
  @Prop({ required: true, enum: ['si', 'no'] })
  trabConoceEstandar: string;

  @Prop({ default: '' })
  trabNombreEstandar: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  trabTieneCompetencias: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  trabTieneAutorizacion: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  trabSegrego: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  trabConoceEmergencia: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  trabUsaEPP: string;

  // ─── PASO 2B — Riesgos críticos Codelco ──────────────────────────────────
  @Prop({
    type: [Object],
    default: [],
  })
  riesgosCriticos: {
    rcNum: number;
    seleccionado: boolean;
    controles: { id: string; label: string; aplica: string }[];
  }[];

  // ─── PASO 3 — Otros riesgos ───────────────────────────────────────────────
  @Prop({ type: [Object], default: [] })
  otrosRiesgos: {
    riesgo: string;
    medidaControl: string;
  }[];

  // ─── PASO 4 — Trabajos simultáneos ───────────────────────────────────────
  @Prop({ required: true, enum: ['si', 'no'] })
  trabajosSimultaneos: string;

  @Prop({ default: '' })
  contextoSimultaneo: string;

  @Prop({ default: '' })
  coordinacionLider: string;

  @Prop({ default: '' })
  verificacionCruzada: string;

  @Prop({ default: '' })
  comunicacionAcciones: string;

  // ─── PASO 5 — Líder ───────────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  liderNombre: string;

  @Prop({ default: '', trim: true })
  liderCargo: string;

  @Prop({ required: true, enum: ['si', 'no'] })
  liderVerificoCondiciones: string;

  @Prop({ default: null })
  liderFirma: string;

  // ─── PASO 5 — Participantes ───────────────────────────────────────────────
  @Prop({ type: [Object], default: [] })
  participantes: {
    nombre: string;
    cargo: string;
    enCondiciones: string;
    firma: string;
  }[];
}

export const ArtSchema = SchemaFactory.createForClass(Art);
