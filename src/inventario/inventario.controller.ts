import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateInventarioDto, AjustarStockDto, DescontarEppDto } from './dto/inventario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EppService } from '../epp/epp.service';

@UseGuards(JwtAuthGuard)
@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly eppService: EppService,
  ) {}

  @Roles('admin', 'logistica')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: CreateInventarioDto) {
    return this.inventarioService.create(dto);
  }

  @Get()
  findAll(
    @Query('categoria') categoria?: string,
    @Query('producto') producto?: string,
  ) {
    return this.inventarioService.findAll(categoria, producto);
  }

  @Get('categorias')
  findCategorias() {
    return this.inventarioService.findCategorias();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventarioService.findOne(id);
  }

  @Roles('admin', 'logistica')
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateInventarioDto>) {
    return this.inventarioService.update(id, dto);
  }

  @Roles('admin', 'logistica')
  @UseGuards(RolesGuard)
  @Patch(':id/stock')
  ajustarStock(@Param('id') id: string, @Body() dto: AjustarStockDto) {
    return this.inventarioService.ajustarStock(id, dto);
  }

  @Post('descontar-epp')
  async descontarEpp(@Body() dto: DescontarEppDto, @CurrentUser() user: any) {
    for (const item of dto.items) {
      await this.inventarioService.ajustarStock(item.inventarioId, { cantidad: -Math.abs(item.cant) });
    }
    const eppDto = {
      trabajador: dto.trabajador,
      fecha: dto.fecha,
      firma: dto.firma,
      items: dto.items.map(i => ({
        epp: i.epp,
        marca: i.marca ?? '',
        cant: i.cant,
        talla: i.talla ?? '',
        fecha: dto.fecha,
      })),
    };
    return this.eppService.create(eppDto, user.userId);
  }

  @Patch(':id/descontar')
  descontar(@Param('id') id: string, @Body() dto: AjustarStockDto) {
    return this.inventarioService.ajustarStock(id, { cantidad: -Math.abs(dto.cantidad) });
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventarioService.remove(id);
  }
}
