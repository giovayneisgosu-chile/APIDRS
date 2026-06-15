import { Document } from 'mongoose';

export interface Product extends Document {
  readonly nombre: string;
  readonly categoria: string;
  readonly talla: string;
  readonly stock: number;
}
