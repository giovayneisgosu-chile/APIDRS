import { Body, Controller, Get, Param, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChecklistService } from './checklist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('checklist')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  @UseInterceptors(FileInterceptor('pdf'))
  create(
    @Body() body: any,
    @CurrentUser() user: any,
    @UploadedFile() file?: { buffer: Buffer; originalname: string },
  ) {
    return this.checklistService.create(body, file?.buffer, user.userId);
  }

  @Get()
  findAll() {
    return this.checklistService.findAll();
  }

  @Get('mis-documentos')
  findMios(@CurrentUser() user: any) {
    return this.checklistService.findByUsuario(user.userId);
  }

  @Get('mis-documentos/count')
  contarMios(@CurrentUser() user: any) {
    return this.checklistService.contarPorUsuario(user.userId);
  }

  @Get('patente/:patente')
  findByPatente(@Param('patente') patente: string) {
    return this.checklistService.findByPatente(patente);
  }
}
