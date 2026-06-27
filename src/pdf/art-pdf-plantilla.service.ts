import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import {
  COLORES, PASO1, TRANSVERSALES, RIESGOS, PASO3, PASO4, PASO5,
} from './templates/art-pdf.coords';
import { RIESGOS_CODELCO } from '../art/constants/riesgos-codelco.constant';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Injectable()
export class ArtPdfPlantillaService {
  private readonly plantillaPath = path.join(
    process.cwd(), 'src', 'pdf', 'templates', 'formato.pdf',
  );

  constructor(private drive: GoogleDriveService) {}

  async generateArtPdf(art: any, userName: string): Promise<string> {
    try {
      const bytes = fs.readFileSync(this.plantillaPath);
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const [pag1, pag2] = pdfDoc.getPages();

      this.rellenarPaso1(pag1, art, font);
      this.rellenarTransversales(pag1, art, font);
      this.rellenarRiesgosCriticos(pag1, art, font, fontBold);
      this.rellenarPaso3(pag2, art, font);
      this.rellenarPaso4(pag2, art, font);
      await this.rellenarPaso5(pdfDoc, pag2, art, font);

      const out = await pdfDoc.save();
      const nombreCarpeta = userName
        .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '_').toUpperCase();
      const carpeta = `ART/${nombreCarpeta}`;
      const fileName = this.buildArtFileName(art);
      return await this.drive.subirPdf(Buffer.from(out), carpeta, fileName);
    } catch (err) {
      throw new InternalServerErrorException(`Error generando PDF: ${err}`);
    }
  }

  // ── Helpers de dibujo ──────────────────────────────────────

  private texto(
    page: PDFPage, font: PDFFont, s: string,
    x: number, y: number, size: number, maxW?: number,
  ): void {
    if (!s) return;
    let fz = size;
    if (maxW) {
      while (fz > 4 && font.widthOfTextAtSize(s, fz) > maxW) fz -= 0.25;
    }
    page.drawText(s, { x, y, size: fz, font, color: rgb(0, 0, 0) });
  }

  private textoCentrado(
    page: PDFPage, font: PDFFont, s: string,
    xc: number, y: number, size: number,
  ): void {
    if (!s) return;
    const w = font.widthOfTextAtSize(s, size);
    page.drawText(s, { x: xc - w / 2, y, size, font, color: rgb(0, 0, 0) });
  }

  private tick(page: PDFPage, xc: number, yc: number, si: boolean): void {
    const t = 1.2;
    if (si) {
      const c = rgb(COLORES.teal.r, COLORES.teal.g, COLORES.teal.b);
      page.drawLine({ start: { x: xc - 3.2, y: yc - 0.2 }, end: { x: xc - 0.8, y: yc - 2.8 }, thickness: t, color: c });
      page.drawLine({ start: { x: xc - 0.8, y: yc - 2.8 }, end: { x: xc + 3.6, y: yc + 3.0 }, thickness: t, color: c });
    } else {
      const c = rgb(COLORES.rojo.r, COLORES.rojo.g, COLORES.rojo.b);
      page.drawLine({ start: { x: xc - 2.8, y: yc - 2.8 }, end: { x: xc + 2.8, y: yc + 2.8 }, thickness: t, color: c });
      page.drawLine({ start: { x: xc - 2.8, y: yc + 2.8 }, end: { x: xc + 2.8, y: yc - 2.8 }, thickness: t, color: c });
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

  // ── PASO 1 ─────────────────────────────────────────────────

  private rellenarPaso1(p: PDFPage, art: any, f: PDFFont): void {
    const c = PASO1;
    this.texto(p, f, art.supervisorAsignador, c.supervisorAsignador.x, c.supervisorAsignador.y, c.supervisorAsignador.size, c.supervisorAsignador.maxW);
    this.texto(p, f, art.empresa, c.empresa.x, c.empresa.y, c.empresa.size, c.empresa.maxW);
    this.texto(p, f, art.gerencia, c.gerencia.x, c.gerencia.y, c.gerencia.size, c.gerencia.maxW);

    const [dia, mes, anio] = String(art.fecha ?? '').split(/[\/\-]/);
    this.textoCentrado(p, f, dia ?? '', c.fechaDia.xc, c.fechaDia.y, c.fechaDia.size);
    this.textoCentrado(p, f, mes ?? '', c.fechaMes.xc, c.fechaMes.y, c.fechaMes.size);
    this.textoCentrado(p, f, anio ?? '', c.fechaAnio.xc, c.fechaAnio.y, c.fechaAnio.size);

    this.texto(p, f, art.horaInicio, c.horaInicio.x, c.horaInicio.y, c.horaInicio.size, c.horaInicio.maxW);
    this.texto(p, f, art.horaTermino, c.horaTermino.x, c.horaTermino.y, c.horaTermino.size, c.horaTermino.maxW);
    this.texto(p, f, art.superintendencia, c.superintendencia.x, c.superintendencia.y, c.superintendencia.size, c.superintendencia.maxW);
    this.texto(p, f, art.lugarEspecifico, c.lugarEspecifico.x, c.lugarEspecifico.y, c.lugarEspecifico.size, c.lugarEspecifico.maxW);
    this.texto(p, f, art.trabajoARealizar, c.trabajoARealizar.x, c.trabajoARealizar.y, c.trabajoARealizar.size, c.trabajoARealizar.maxW);
  }

  // ── PREGUNTAS TRANSVERSALES ───────────────────────────────

  private rellenarTransversales(p: PDFPage, art: any, f: PDFFont): void {
    const t = TRANSVERSALES;
    const camposSup = [
      'supTieneEstandar', 'supPersonalCapacitado', 'supSolicitoPermisos',
      'supVerificoSegregacion', 'supPersonalComunicacion', 'supPersonalEPP',
    ];
    const camposTrab = [
      'trabConoceEstandar', 'trabTieneCompetencias', 'trabTieneAutorizacion',
      'trabSegrego', 'trabConoceEmergencia', 'trabUsaEPP',
    ];
    camposSup.forEach((campo, i) => {
      const v = art[campo];
      if (v === 'si') this.tick(p, t.supervisor.siX, t.filasY[i], true);
      else if (v === 'no') this.tick(p, t.supervisor.noX, t.filasY[i], false);
    });
    camposTrab.forEach((campo, i) => {
      const v = art[campo];
      if (v === 'si') this.tick(p, t.trabajador.siX, t.filasY[i], true);
      else if (v === 'no') this.tick(p, t.trabajador.noX, t.filasY[i], false);
    });
    if (art.supTieneEstandar === 'si') {
      this.texto(p, f, art.supNombreEstandar, t.supNombreEstandar.x, t.supNombreEstandar.y, t.supNombreEstandar.size, t.supNombreEstandar.maxW);
    }
    if (art.trabConoceEstandar === 'si') {
      this.texto(p, f, art.trabNombreEstandar, t.trabNombreEstandar.x, t.trabNombreEstandar.y, t.trabNombreEstandar.size, t.trabNombreEstandar.maxW);
    }
  }

  // ── RIESGOS CRÍTICOS ──────────────────────────────────────

  private rellenarRiesgosCriticos(p: PDFPage, art: any, f: PDFFont, fb: PDFFont): void {
    const R = RIESGOS;
    const seleccionados = (art.riesgosCriticos ?? [])
      .filter((r: any) => r.seleccionado)
      .slice(0, 6);

    seleccionados.forEach((r: any, k: number) => {
      const bx = R.colsX[k];
      const codigo = `RF-${String(r.rcNum).padStart(2, '0')}`;
      const info = RIESGOS_CODELCO.find((x: any) => x.codigo === codigo);
      const nombre = info?.nombre ?? '';

      for (const sec of [R.supervisor, R.trabajador]) {
        const lineas = this.envolver(f, nombre, sec.nombreL1.size, sec.nombreL1.maxW);
        this.texto(p, f, lineas[0] ?? '', bx + sec.nombreL1.dx, sec.nombreL1.y, sec.nombreL1.size);
        if (lineas.length > 1) {
          this.texto(p, f, lineas.slice(1).join(' '), bx + sec.nombreL2.dx, sec.nombreL2.y, sec.nombreL2.size, sec.nombreL2.maxW);
        }
        this.texto(p, fb, codigo, bx + sec.cod.dx, sec.cod.y, sec.cod.size);
        (r.controles ?? []).slice(0, 10).forEach((ctrl: any, i: number) => {
          const y = sec.filasY[i];
          this.texto(p, f, ctrl.label ?? '', bx + R.ctrlDx, y - 2.5, 5.5);
          if (ctrl.aplica === 'si') this.tick(p, bx + R.siDx, y, true);
          else if (ctrl.aplica === 'no') this.tick(p, bx + R.noDx, y, false);
        });
      }
    });
  }

  // ── PASO 3 ─────────────────────────────────────────────────

  private rellenarPaso3(p: PDFPage, art: any, f: PDFFont): void {
    const c = PASO3;
    const filas = (art.otrosRiesgos ?? [])
      .filter((r: any) => r.riesgo || r.medidaControl)
      .slice(0, c.filasY.length);
    filas.forEach((r: any, i: number) => {
      this.texto(p, f, r.riesgo, c.riesgoX, c.filasY[i] - 2, c.size, c.maxWRiesgo);
      this.texto(p, f, r.medidaControl, c.medidaX, c.filasY[i] - 2, c.size, c.maxWMedida);
    });
  }

  // ── PASO 4 ─────────────────────────────────────────────────

  private rellenarPaso4(p: PDFPage, art: any, f: PDFFont): void {
    const c = PASO4;
    const marca = (v: string, si: { xc: number }, no: { xc: number }) => {
      if (v === 'si') this.tick(p, si.xc, c.tickY, true);
      else if (v === 'no') this.tick(p, no.xc, c.tickY, false);
    };
    marca(art.trabajosSimultaneos, c.existenSi, c.existenNo);
    marca(art.coordinacionLider, c.coordinacionSi, c.coordinacionNo);
    marca(art.verificacionCruzada, c.verificacionSi, c.verificacionNo);
    marca(art.comunicacionAcciones, c.comunicacionSi, c.comunicacionNo);

    if (art.contextoSimultaneo) {
      const lineas = this.envolver(f, art.contextoSimultaneo, c.contexto.size, c.contexto.maxW);
      lineas.slice(0, 8).forEach((l, i) => {
        this.texto(p, f, l, c.contexto.x, c.contexto.y - i * c.contexto.lineH, c.contexto.size);
      });
    }
  }

  // ── PASO 5 ─────────────────────────────────────────────────

  private async rellenarPaso5(doc: PDFDocument, p: PDFPage, art: any, f: PDFFont): Promise<void> {
    const c = PASO5;
    this.texto(p, f, art.liderNombre, c.nombreX, c.lider.y - 2.5, c.sizeNombre, 168);
    this.texto(p, f, art.liderCargo, c.cargoX, c.lider.y - 2.5, c.sizeCargo, 78);
    if (art.liderVerificoCondiciones === 'si') this.tick(p, c.siXc, c.lider.y, true);
    else if (art.liderVerificoCondiciones === 'no') this.tick(p, c.noXc, c.lider.y, false);
    await this.dibujarFirma(doc, p, art.liderFirma, c.firmaXc, c.lider.y, c.firmaMaxW, c.lider.firmaH);

    const participantes = (art.participantes ?? []).slice(0, c.filasTrabY.length);
    for (let i = 0; i < participantes.length; i++) {
      const t = participantes[i];
      const y = c.filasTrabY[i];
      this.texto(p, f, t.nombre, c.nombreX, y - 2.5, c.sizeNombre, 168);
      this.texto(p, f, t.cargo, c.cargoX, y - 2.5, c.sizeCargo, 78);
      if (t.enCondiciones === 'si') this.tick(p, c.siXc, y, true);
      else if (t.enCondiciones === 'no') this.tick(p, c.noXc, y, false);
      await this.dibujarFirma(doc, p, t.firma, c.firmaXc, y, c.firmaMaxW, c.filaAlto - 3);
    }
  }

  private async dibujarFirma(
    doc: PDFDocument, p: PDFPage, dataUrl: string | undefined,
    xc: number, yc: number, maxW: number, maxH: number,
  ): Promise<void> {
    if (!dataUrl) return;
    try {
      const base64 = dataUrl.replace(/^data:image\/(png|jpe?g);base64,/, '');
      const bytes = Buffer.from(base64, 'base64');
      const img = dataUrl.includes('jpeg') || dataUrl.includes('jpg')
        ? await doc.embedJpg(bytes)
        : await doc.embedPng(bytes);
      const escala = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * escala;
      const h = img.height * escala;
      p.drawImage(img, { x: xc - w / 2, y: yc - h / 2, width: w, height: h });
    } catch {
      // firma inválida: se omite sin romper la generación
    }
  }

  private buildArtFileName(art: any): string {
    const nombre = String(art.liderNombre ?? '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '-').toUpperCase();
    const fecha = String(art.fecha).replace(/\//g, '-');
    return `ART-${nombre}-${fecha}.pdf`;
  }
}
