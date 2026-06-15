import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EppController } from './epp.controller';
import { EppService } from './epp.service';
import { Epp, EppSchema } from './schemas/epp.schema';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Epp.name, schema: EppSchema }]),
    PdfModule,
    UsersModule,
  ],
  controllers: [EppController],
  providers: [EppService],
})
export class EppModule {}
