import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { DATOS, TEMA, PARTICIPANTES, FOOTER } from './templates/difusion-pdf.coords';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const TEAL = rgb(0, 155 / 255, 158 / 255);
const NEGRO = rgb(0, 0, 0);
const POR_PAGINA = 15;

@Injectable()
export class DifusionPdfService {
  private readonly templatesBase = path.join(process.cwd(), 'src', 'pdf', 'templates');

  constructor(private cloudinary: CloudinaryService) {}

  async generarPdfs(difusion: any): Promise<{ urlDrs?: string; urlFda?: string }> {
    const result: { urlDrs?: string; urlFda?: string } = {};
    const slug = this.slugify(difusion.temaPrincipal);
    const fecha = String(difusion.fecha).replace(/\//g, '-');

    const pDrs = (difusion.participantes ?? []).filter((p: any) => p.empresa?.toLowerCase() === 'drs');
    const pFda = (difusion.participantes ?? []).filter((p: any) => p.empresa?.toLowerCase() === 'fda');

    if (pDrs.length > 0) {
      const fileName = `DIFUSION_${slug}_${fecha}_DRS.pdf`;
      result.urlDrs = await this.generarPdf('difusion-drs.pdf', difusion, pDrs, fileName);
    }
    if (pFda.length > 0) {
      const fileName = `DIFUSION_${slug}_${fecha}_FDA.pdf`;
      result.urlFda = await this.generarPdf('difusion-fda.pdf', difusion, pFda, fileName);
    }
    return result;
  }

  private async generarPdf(
    templateName: string, difusion: any,
    participantes: any[], fileName: string,
  ): Promise<string> {
    try {
      const plantillaBytes = fs.readFileSync(path.join(this.templatesBase, templateName));
      const paginas = Math.ceil(participantes.length / POR_PAGINA) || 1;
      const pdfDoc = await PDFDocument.create();
      const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (let p = 0; p < paginas; p++) {
        const plantilla = await PDFDocument.load(plantillaBytes);
        const [plantillaPag] = await pdfDoc.copyPages(plantilla, [0]);
        pdfDoc.addPage(plantillaPag);
        const page = pdfDoc.getPages()[p];

        this.rellenarDatos(page, difusion, font, fontBold);
        this.rellenarTema(page, difusion.temaPrincipal, font);

        const slice = participantes.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);
        const offsetNum = p * POR_PAGINA;
        await this.rellenarParticipantes(pdfDoc, page, slice, offsetNum, font);

        const totalPag = participantes.length;
        await this.rellenarFooter(pdfDoc, page, difusion, totalPag, font);
      }

      const out = await pdfDoc.save();
      return await this.cloudinary.subirPdf(Buffer.from(out), 'difusiones', fileName);
    } catch (err) {
      throw new InternalServerErrorException(`Error generando PDF difusión: ${err}`);
    }
  }

  // ── Sección 1: Datos de la actividad ──────────────────────

  private rellenarDatos(page: PDFPage, d: any, f: PDFFont, _fb: PDFFont): void {
    const tipos: Record<string, { xc: number; y: number }> = {
      charla_seguridad: DATOS.tipoActividad.charlaSeg,
      capacitacion:     DATOS.tipoActividad.capacitacion,
      reflexion:        DATOS.tipoActividad.reflexion,
      reunion:          DATOS.tipoActividad.reunion,
    };
    const tPos = tipos[d.tipoActividad];
    if (tPos) this.tick(page, tPos.xc, tPos.y, true);

    if (d.modalidad === 'interna')   this.tick(page, DATOS.modalidad.interna.xc,    DATOS.modalidad.interna.y,    true);
    if (d.modalidad === 'externa')   this.tick(page, DATOS.modalidad.externa.xc,    DATOS.modalidad.externa.y,    true);
    if (d.asistencia === 'presencial') this.tick(page, DATOS.asistencia.presencial.xc, DATOS.asistencia.presencial.y, true);
    if (d.asistencia === 'elearning')  this.tick(page, DATOS.asistencia.elearning.xc,  DATOS.asistencia.elearning.y,  true);

    this.texto(page, f, d.relator,   DATOS.relator.x,   DATOS.relator.y,   DATOS.relator.size,   DATOS.relator.maxW);
    this.texto(page, f, d.rutRelator, DATOS.rut.x,      DATOS.rut.y,       DATOS.rut.size,       DATOS.rut.maxW);
    this.texto(page, f, d.cargo,     DATOS.cargo.x,     DATOS.cargo.y,     DATOS.cargo.size,     DATOS.cargo.maxW);
    this.texto(page, f, d.ubicacion, DATOS.ubicacion.x, DATOS.ubicacion.y, DATOS.ubicacion.size, DATOS.ubicacion.maxW);
  }

  // ── Sección 2: Tema principal ──────────────────────────────

  private rellenarTema(page: PDFPage, tema: string, f: PDFFont): void {
    const T = TEMA;
    const lineas = this.envolver(f, tema ?? '', T.size, T.maxW);
    lineas.slice(0, T.maxLineas).forEach((l, i) => {
      page.drawText(l, { x: T.x, y: T.yInicio - i * T.lineH, size: T.size, font: f, color: NEGRO });
    });
  }

  // ── Sección 3: Participantes ───────────────────────────────

  private async rellenarParticipantes(
    doc: PDFDocument, page: PDFPage,
    participantes: any[], offsetNum: number, f: PDFFont,
  ): Promise<void> {
    const P = PARTICIPANTES;
    for (let i = 0; i < participantes.length; i++) {
      const p = participantes[i];
      const y = P.yInicio - i * P.lineH;
      page.drawText(String(offsetNum + i + 1), { x: P.numX, y: y - 2, size: P.size, font: f, color: NEGRO });
      this.texto(page, f, p.nombre,   P.nombreX,   y - 2, P.size, P.nombreMaxW);
      this.texto(page, f, p.rut,      P.rutX,      y - 2, P.size, P.rutMaxW);
      this.texto(page, f, p.cargo,    P.cargoX,    y - 2, P.size, P.cargoMaxW);
      this.texto(page, f, p.proyecto, P.proyectoX, y - 2, P.size, P.proyectoMaxW);
      if (p.firmado && p.firma) {
        await this.dibujarFirma(doc, page, p.firma, P.firmaXc, y, P.firmaMaxW, P.firmaMaxH);
      }
    }
  }

  // ── Footer ─────────────────────────────────────────────────

  private async rellenarFooter(doc: PDFDocument, page: PDFPage, d: any, total: number, f: PDFFont): Promise<void> {
    const F = FOOTER;
    this.texto(page, f, String(total),   F.numParticipantes.x, F.numParticipantes.y, F.numParticipantes.size);
    this.texto(page, f, d.fecha,         F.fecha.x,            F.fecha.y,            F.fecha.size);
    this.texto(page, f, d.horaInicio,    F.horaInicio.x,       F.horaInicio.y,       F.horaInicio.size);
    this.texto(page, f, d.horaTermino,   F.horaTermino.x,      F.horaTermino.y,      F.horaTermino.size);
    this.texto(page, f, d.duracion,      F.duracion.x,         F.duracion.y,         F.duracion.size);
    this.texto(page, f, d.hhTotales,     F.hhTotales.x,        F.hhTotales.y,        F.hhTotales.size);
    if (d.firmaRelator) {
      await this.dibujarFirma(doc, page, d.firmaRelator, F.firmaRelator.xc, F.firmaRelator.y, F.firmaRelator.maxW, F.firmaRelator.maxH);
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private texto(page: PDFPage, font: PDFFont, s: string, x: number, y: number, size: number, maxW?: number): void {
    if (!s) return;
    let fz = size;
    if (maxW) while (fz > 4 && font.widthOfTextAtSize(s, fz) > maxW) fz -= 0.25;
    page.drawText(s, { x, y, size: fz, font, color: NEGRO });
  }

  private tick(page: PDFPage, xc: number, yc: number, si: boolean): void {
    const t = 1.2;
    const c = si ? TEAL : rgb(204 / 255, 18 / 255, 18 / 255);
    if (si) {
      page.drawLine({ start: { x: xc - 3.2, y: yc - 0.2 }, end: { x: xc - 0.8, y: yc - 2.8 }, thickness: t, color: c });
      page.drawLine({ start: { x: xc - 0.8, y: yc - 2.8 }, end: { x: xc + 3.6, y: yc + 3.0 }, thickness: t, color: c });
    }
  }

  private envolver(font: PDFFont, s: string, size: number, maxW: number): string[] {
    const palabras = (s ?? '').split(/\s+/).filter(Boolean);
    const lineas: string[] = [];
    let actual = '';
    for (const p of palabras) {
      const intento = actual ? `${actual} ${p}` : p;
      if (font.widthOfTextAtSize(intento, size) <= maxW) actual = intento;
      else { if (actual) lineas.push(actual); actual = p; }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  private async dibujarFirma(
    doc: PDFDocument, page: PDFPage, dataUrl: string,
    xc: number, yc: number, maxW: number, maxH: number,
  ): Promise<void> {
    if (!dataUrl) return;
    try {
      const base64 = dataUrl.replace(/^data:image\/(png|jpe?g);base64,/, '');
      const bytes = Buffer.from(base64, 'base64');
      const img = dataUrl.includes('jpeg') || dataUrl.includes('jpg')
        ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      const escala = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * escala;
      const h = img.height * escala;
      page.drawImage(img, { x: xc - w / 2, y: yc - h / 2, width: w, height: h });
    } catch { }
  }

  private slugify(s: string): string {
    return (s ?? 'Difusion')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim().replace(/\s+/g, '-')
      .substring(0, 40);
  }
}
