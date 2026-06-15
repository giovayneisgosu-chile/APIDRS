export class ItemEppDto {
  epp: string;
  marca?: string;
  cant: number;
  talla?: string;
  fecha?: string;
}

export class TrabajadorEppDto {
  nombre: string;
  rut: string;
  cargo: string;
  usuarioId?: string;
}

export class CreateEppDto {
  trabajador: TrabajadorEppDto;
  fecha: string;
  items: ItemEppDto[];
}
