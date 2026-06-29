import { Module } from '@nestjs/common';
import { InspeccionController } from './inspeccion.controller';
import { InspeccionService } from './inspeccion.service';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [GoogleSheetsModule],
  controllers: [InspeccionController],
  providers: [InspeccionService],
})
export class InspeccionModule {}
