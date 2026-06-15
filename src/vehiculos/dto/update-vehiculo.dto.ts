import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateKilometrajeDto {
  @IsNumber()
  kilometraje: number;

  @IsOptional()
  @IsString()
  fecha?: string;
}

export class UpdateMantencionDto {
  @IsNumber()
  proximaMantencion: number;
}
