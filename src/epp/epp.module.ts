import { Module } from '@nestjs/common';
import { EppController } from './epp.controller';
import { EppService } from './epp.service';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PdfModule, UsersModule],
  controllers: [EppController],
  providers: [EppService],
  exports: [EppService],
})
export class EppModule {}
