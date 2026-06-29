import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArtModule } from './art/art.module';
import { DifusionModule } from './difusion/difusion.module';
import { EppModule } from './epp/epp.module';
import { InventarioModule } from './inventario/inventario.module';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ChecklistModule } from './checklist/checklist.module';
import { PlanificacionModule } from './planificacion/planificacion.module';
import { InspeccionModule } from './inspeccion/inspeccion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GoogleSheetsModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    ArtModule,
    DifusionModule,
    EppModule,
    InventarioModule,
    GoogleDriveModule,
    VehiculosModule,
    ChecklistModule,
    PlanificacionModule,
    InspeccionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
