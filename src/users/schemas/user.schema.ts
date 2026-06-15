import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  USUARIO = 'usuario',
  SSO = 'sso',
  CONSTRUCCION = 'construccion',
  LOGISTICA = 'logistica',
}

@Schema({ timestamps: true, collection: 'usuarios' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  rut: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USUARIO })
  rol: UserRole;

  @Prop({ type: String, enum: ['drs', 'fda'], default: 'drs' })
  empresa: string;

  @Prop({ default: null })
  signature: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
