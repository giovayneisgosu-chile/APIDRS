import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ArtPdfPlantillaService } from './art-pdf-plantilla.service';
import { DifusionPdfService } from './difusion-pdf.service';
import { EppPdfService } from './epp-pdf.service';

@Module({
  providers: [PdfService, ArtPdfPlantillaService, DifusionPdfService, EppPdfService],
  exports: [PdfService, ArtPdfPlantillaService, DifusionPdfService, EppPdfService],
})
export class PdfModule {}
