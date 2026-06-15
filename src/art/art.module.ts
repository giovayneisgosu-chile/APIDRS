import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArtController } from './art.controller';
import { ArtService } from './art.service';
import { Art, ArtSchema } from './schemas/art.schema';
import { PdfModule } from '../pdf/pdf.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Art.name, schema: ArtSchema }]),
    PdfModule,
    UsersModule,
  ],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
