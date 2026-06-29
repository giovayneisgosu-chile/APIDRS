import { Module } from '@nestjs/common';
import { ReportePodController } from './reporte-pod.controller';
import { ReportePodService } from './reporte-pod.service';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [GoogleSheetsModule, GoogleDriveModule],
  controllers: [ReportePodController],
  providers: [ReportePodService],
})
export class ReportePodModule {}
