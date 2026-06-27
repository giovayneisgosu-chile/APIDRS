import { Module } from '@nestjs/common';
import { ArtPdfPlantillaService } from './art-pdf-plantilla.service';
import { DifusionPdfService } from './difusion-pdf.service';
import { EppPdfService } from './epp-pdf.service';

@Module({
  providers: [ArtPdfPlantillaService, DifusionPdfService, EppPdfService],
  exports: [ArtPdfPlantillaService, DifusionPdfService, EppPdfService],
})
export class PdfModule {}
