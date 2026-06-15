import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArtModule } from './art/art.module';
import { DifusionModule } from './difusion/difusion.module';
import { EppModule } from './epp/epp.module';
import { InventarioModule } from './inventario/inventario.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ChecklistModule } from './checklist/checklist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ProductsModule,
    UsersModule,
    AuthModule,
    ArtModule,
    DifusionModule,
    EppModule,
    InventarioModule,
    CloudinaryModule,
    GoogleSheetsModule,
    VehiculosModule,
    ChecklistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
