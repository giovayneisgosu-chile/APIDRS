import { Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { DifusionService } from './difusion.service';
import { CreateDifusionDto } from './dto/create-difusion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('difusion')
export class DifusionController {
  constructor(private readonly difusionService: DifusionService) {}

  @Post()
  create(@Body() dto: CreateDifusionDto, @CurrentUser() user: any) {
    return this.difusionService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('estado') estado?: string,
    @Query('empresa') empresa?: string,
  ) {
    return this.difusionService.findAll({ userId, estado, empresa });
  }

  @Get('mis-pendientes')
  misPendientes(@CurrentUser() user: any) {
    return this.difusionService.findMisPendientes(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.difusionService.findOne(id);
  }

  @Patch(':id/firmar')
  firmar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.difusionService.firmar(id, user.userId);
  }

  @Patch(':id/pdf')
  regenerarPdfs(@Param('id') id: string) {
    return this.difusionService.regenerarPdfs(id);
  }

  @Roles('admin', 'sso')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.difusionService.remove(id);
  }
}
