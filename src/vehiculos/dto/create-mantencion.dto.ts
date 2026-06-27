export class CreateMantencionDto {
  numeroFactura: string;
  fecha: string;
  proximaMantencion: number;
  valorNeto: number;
  contrato: string;
  imagenBase64?: string;
  imagenMimeType?: string;
}
