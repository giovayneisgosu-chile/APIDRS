import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DifusionController } from './difusion.controller';
import { DifusionService } from './difusion.service';
import { Difusion, DifusionSchema } from './schemas/difusion.schema';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Difusion.name, schema: DifusionSchema }]),
    PdfModule,
    UsersModule,
  ],
  controllers: [DifusionController],
  providers: [DifusionService],
})
export class DifusionModule {}
