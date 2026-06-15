import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checklist')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  create(@Body() body: any) {
    return this.checklistService.create(body);
  }

  @Get()
  findAll() {
    return this.checklistService.findAll();
  }

  @Get('patente/:patente')
  findByPatente(@Param('patente') patente: string) {
    return this.checklistService.findByPatente(patente);
  }
}
