import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PlanificacionService } from './planificacion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('planificacion')
@UseGuards(JwtAuthGuard)
export class PlanificacionController {
  constructor(private readonly service: PlanificacionService) {}

  @Get('actividades')
  getActividades(
    @Query('especialidad') especialidad: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.getActividades(especialidad, fecha);
  }

  @Get('actividades-responsable')
  getActividadesPorResponsable(
    @Query('responsable') responsable: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.getActividadesPorResponsable(responsable, fecha);
  }

  @Post('ejecucion')
  registrarEjecucion(@Body() dto: any) {
    return this.service.registrarEjecucion(dto);
  }

  @Get('ejecucion')
  getEjecucion(
    @Query('especialidad') especialidad?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.getEjecucion(especialidad, fecha);
  }
}
