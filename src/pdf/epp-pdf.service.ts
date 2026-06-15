import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { EPP_CABECERA, EPP_TABLA, EPP_PIE } from './templates/epp-pdf.coords';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class EppPdfService {
  private readonly templatesBase = path.join(process.cwd(), 'src', 'pdf', 'templates');

  constructor(private cloudinary: CloudinaryService) {}

  async generateEppPdf(datos: any, userName: string, fileName = 'entrega_epp.pdf'): Promise<string> {
    const empresa = (datos.empresa ?? 'drs').toLowerCase();
    const templateName = empresa === 'fda' ? 'epp-fda.pdf' : 'epp-drs.pdf';
    const templatePath = path.join(this.templatesBase, templateName);

    try {
      const bytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.getPages()[0];

      const firmaImg = await this.embedFirma(pdfDoc, datos.firma);

      this.rellenarCabecera(page, datos, font);
      await this.rellenarTabla(page, datos, font, firmaImg);
      this.rellenarPie(page, datos, font, firmaImg);

      const out = await pdfDoc.save();
      const nombreCarpeta = userName
        .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '_').toUpperCase();
      const carpeta = `EPP/${nombreCarpeta}`;
      return await this.cloudinary.subirPdf(Buffer.from(out), carpeta, fileName);
    } catch (err) {
      throw new InternalServerErrorException(`Error generando PDF EPP: ${err}`);
    }
  }

  private async embedFirma(doc: PDFDocument, dataUrl: string | null | undefined): Promise<PDFImage | null> {
    if (!dataUrl) return null;
    try {
      const base64 = dataUrl.replace(/^data:image\/(png|jpe?g);base64,/, '');
      const imgBytes = Buffer.from(base64, 'base64');
      return dataUrl.includes('jpeg') || dataUrl.includes('jpg')
        ? await doc.embedJpg(imgBytes)
        : await doc.embedPng(imgBytes);
    } catch {
      return null;
    }
  }

  private dibujarFirmaImg(
    page: PDFPage, img: PDFImage, xc: number, yc: number, maxW: number, maxH: number,
  ): void {
    const escala = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * escala;
    const h = img.height * escala;
    page.drawImage(img, { x: xc - w / 2, y: yc - h / 2, width: w, height: h });
  }

  // ── Helpers ──────────────────────────────────────────────────

  private texto(
    page: PDFPage, font: PDFFont, s: string,
    x: number, y: number, size: number, maxW?: number,
  ): void {
    if (!s) return;
    let fz = size;
    if (maxW) while (fz > 4 && font.widthOfTextAtSize(String(s), fz) > maxW) fz -= 0.25;
    page.drawText(String(s), { x, y, size: fz, font, color: rgb(0, 0, 0) });
  }

  private textoCentrado(
    page: PDFPage, font: PDFFont, s: string,
    xc: number, y: number, size: number,
  ): void {
    if (!s) return;
    const w = font.widthOfTextAtSize(String(s), size);
    page.drawText(String(s), { x: xc - w / 2, y, size, font, color: rgb(0, 0, 0) });
  }

  // ── Secciones ────────────────────────────────────────────────

  private rellenarCabecera(p: PDFPage, d: any, f: PDFFont): void {
    const c = EPP_CABECERA;
    this.textoCentrado(p, f, d.nombre, c.nombre.xc, c.nombre.y, c.nombre.size);
    this.textoCentrado(p, f, d.numero, c.numero.xc, c.numero.y, c.numero.size);
    this.texto(p, f, d.cargo,  c.cargo.x,   c.cargo.y,  c.cargo.size,  c.cargo.maxW);
    this.textoCentrado(p, f, d.rut,   c.rut.xc,   c.rut.y,   c.rut.size);
    this.textoCentrado(p, f, d.fecha, c.fecha.xc, c.fecha.y, c.fecha.size);
  }

  private async rellenarTabla(p: PDFPage, d: any, f: PDFFont, firmaImg: PDFImage | null): Promise<void> {
    const t = EPP_TABLA;
    const elementos = (d.elementos ?? []).slice(0, t.filasY.length);
    for (let i = 0; i < elementos.length; i++) {
      const el = elementos[i];
      const y = t.filasY[i] + t.dyTexto;
      const yc = t.filasY[i] - t.rowH / 2;
      this.texto(p, f, el.epp,      t.col.epp.x,   y, t.col.epp.size,   t.col.epp.maxW);
      this.texto(p, f, el.marca,    t.col.marca.x, y, t.col.marca.size, t.col.marca.maxW);
      this.textoCentrado(p, f, el.cant,     t.col.cant.xc,     y, t.col.cant.size);
      this.textoCentrado(p, f, el.talla,    t.col.talla.xc,    y, t.col.talla.size);
      this.textoCentrado(p, f, el.fecha,    t.col.fecha.xc,    y, t.col.fecha.size);
      this.textoCentrado(p, f, el.recambio, t.col.recambio.xc, y, t.col.recambio.size);
      if (firmaImg) {
        this.dibujarFirmaImg(p, firmaImg, t.col.firma.xc,  yc, t.col.firma.maxW,  t.col.firma.maxH);
        this.dibujarFirmaImg(p, firmaImg, t.col.firma2.xc, yc, t.col.firma2.maxW, t.col.firma2.maxH);
      }
    }
  }

  private rellenarPie(p: PDFPage, d: any, f: PDFFont, firmaImg: PDFImage | null): void {
    const c = EPP_PIE;
    this.texto(p, f, d.entregadoPor,   c.entregadoPor.x, c.entregadoPor.y, c.entregadoPor.size, c.entregadoPor.maxW);
    this.texto(p, f, d.entregadoRut,   c.rut.x,          c.rut.y,          c.rut.size,          c.rut.maxW);
    this.texto(p, f, d.entregadoCargo, c.cargo.x,        c.cargo.y,        c.cargo.size,        c.cargo.maxW);
    if (firmaImg) {
      this.dibujarFirmaImg(p, firmaImg, c.firma.xc, c.firma.yc, c.firma.maxW, c.firma.maxH);
    }
  }
}
