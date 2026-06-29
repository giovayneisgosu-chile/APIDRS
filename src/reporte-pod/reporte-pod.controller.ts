import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportePodService } from './reporte-pod.service';

@UseGuards(JwtAuthGuard)
@Controller('reporte-pod')
export class ReportePodController {
  constructor(private readonly service: ReportePodService) {}

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.service.create(body, user.email);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('mis-reportes')
  findMios(@Query('responsable') responsable: string) {
    return this.service.findByResponsable(responsable);
  }
}
