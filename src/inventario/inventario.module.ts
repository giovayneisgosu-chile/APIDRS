import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { Inventario, InventarioSchema } from './schemas/inventario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inventario.name, schema: InventarioSchema }]),
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
