import { Module } from '@nestjs/common';
import { ArtController } from './art.controller';
import { ArtService } from './art.service';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PdfModule, UsersModule],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
