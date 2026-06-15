import { Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ArtService } from './art.service';
import { CreateArtDto } from './dto/create-art.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('art')
export class ArtController {
  constructor(private readonly artService: ArtService) {}

  @Post()
  create(@Body() dto: CreateArtDto, @CurrentUser() user: any) {
    return this.artService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('empresa') empresa?: string,
  ) {
    return this.artService.findAll({ userId, fechaDesde, fechaHasta, empresa });
  }

  @Get('stats')
  getStats(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.artService.getStats({ fechaDesde, fechaHasta });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artService.findOne(id);
  }

  @Patch(':id/pdf')
  regenerarPdf(@Param('id') id: string, @CurrentUser() user: any) {
    return this.artService.regenerarPdf(id, user.userId);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.artService.remove(id);
  }
}
