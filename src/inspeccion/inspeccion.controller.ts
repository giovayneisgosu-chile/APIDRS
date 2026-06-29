import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InspeccionService } from './inspeccion.service';

@UseGuards(JwtAuthGuard)
@Controller('inspeccion')
export class InspeccionController {
  constructor(private readonly service: InspeccionService) {}

  @Get('categorias')
  getCategorias() {
    return this.service.getCategorias();
  }

  @Get('flota')
  getEstadoFlota() {
    return this.service.getEstadoFlota();
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':patente')
  findByPatente(@Param('patente') patente: string) {
    return this.service.findByPatente(patente);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.service.create({
      patente: body.patente,
      realizadoPor: body.realizadoPor,
      realizadoPorEmail: user.email,
      items: body.items,
      observaciones: body.observaciones,
    });
  }
}
