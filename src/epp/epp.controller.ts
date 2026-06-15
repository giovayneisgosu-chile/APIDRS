import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EppService } from './epp.service';
import { CreateEppDto } from './dto/create-epp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('epp')
export class EppController {
  constructor(private readonly eppService: EppService) {}

  @Roles('admin', 'logistica')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: CreateEppDto, @CurrentUser() user: any) {
    return this.eppService.create(dto, user.userId);
  }

  @Roles('admin', 'sso', 'logistica')
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.eppService.findAll();
  }

  @Get('mis-pendientes')
  findMisPendientes(@CurrentUser() user: any) {
    return this.eppService.findMisPendientes(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eppService.findOne(id);
  }

  @Patch(':id/firmar')
  firmar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eppService.firmar(id, user.userId);
  }

  @Roles('admin', 'logistica')
  @UseGuards(RolesGuard)
  @Patch(':id/pdf')
  regenerarPdf(@Param('id') id: string) {
    return this.eppService.regenerarPdf(id);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eppService.remove(id);
  }
}
