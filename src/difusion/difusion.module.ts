import { Module } from '@nestjs/common';
import { DifusionController } from './difusion.controller';
import { DifusionService } from './difusion.service';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PdfModule, UsersModule],
  controllers: [DifusionController],
  providers: [DifusionService],
})
export class DifusionModule {}
