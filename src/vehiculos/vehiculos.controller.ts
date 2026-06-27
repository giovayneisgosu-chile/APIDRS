import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { UpdateKilometrajeDto, UpdateMantencionDto } from './dto/update-vehiculo.dto';
import { CreateMantencionDto } from './dto/create-mantencion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vehiculos')
@UseGuards(JwtAuthGuard)
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get()
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Put(':patente/kilometraje')
  updateKilometraje(
    @Param('patente') patente: string,
    @Body() dto: UpdateKilometrajeDto,
  ) {
    return this.vehiculosService.updateKilometraje(patente, dto);
  }

  @Put(':patente/mantencion')
  updateMantencion(
    @Param('patente') patente: string,
    @Body() dto: UpdateMantencionDto,
  ) {
    return this.vehiculosService.updateMantencion(patente, dto);
  }

  @Post(':patente/mantenciones')
  subirMantencion(
    @Param('patente') patente: string,
    @Body() dto: CreateMantencionDto,
  ) {
    return this.vehiculosService.subirMantencion(patente, dto);
  }
}
