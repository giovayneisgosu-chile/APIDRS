import { Module } from '@nestjs/common';
import { PlanificacionController } from './planificacion.controller';
import { PlanificacionService } from './planificacion.service';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [GoogleSheetsModule, GoogleDriveModule],
  controllers: [PlanificacionController],
  providers: [PlanificacionService],
})
export class PlanificacionModule {}
