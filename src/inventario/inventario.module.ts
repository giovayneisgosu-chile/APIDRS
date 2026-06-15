import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { Inventario, InventarioSchema } from './schemas/inventario.schema';
import { EppModule } from '../epp/epp.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inventario.name, schema: InventarioSchema }]),
    EppModule,
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
