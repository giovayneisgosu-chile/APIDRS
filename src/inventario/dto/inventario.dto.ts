export class CreateInventarioDto {
  categoria: string;
  producto: string;
  talla?: string;
  stock: number;
}

export class AjustarStockDto {
  cantidad: number;  // positivo = entrada, negativo = salida
}

export class ItemDescontarEppDto {
  inventarioId: string;
  epp: string;
  marca?: string;
  cant: number;
  talla?: string;
}

export class TrabajadorEppSimpleDto {
  nombre: string;
  rut: string;
  cargo: string;
  usuarioId?: string;
}

export class DescontarEppDto {
  trabajador: TrabajadorEppSimpleDto;
  fecha: string;
  items: ItemDescontarEppDto[];
  firma?: string;
}
