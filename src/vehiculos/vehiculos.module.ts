import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehiculo, VehiculoSchema } from './schemas/vehiculo.schema';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Vehiculo.name, schema: VehiculoSchema }])],
  controllers: [VehiculosController],
  providers: [VehiculosService],
})
export class VehiculosModule {}
