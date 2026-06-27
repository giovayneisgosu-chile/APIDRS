import { Module } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [GoogleDriveModule],
  controllers: [VehiculosController],
  providers: [VehiculosService],
})
export class VehiculosModule {}
