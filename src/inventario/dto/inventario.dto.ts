export class CreateInventarioDto {
  categoria: string;
  producto: string;
  talla?: string;
  stock: number;
}

export class AjustarStockDto {
  cantidad: number;  // positivo = entrada, negativo = salida
}
