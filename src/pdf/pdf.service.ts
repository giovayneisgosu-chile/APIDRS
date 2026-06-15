import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { buildArtHtml } from './templates/art.template';

@Injectable()
export class PdfService {
  private readonly uploadsBase = path.join(process.cwd(), 'uploads');

  async generateArtPdf(art: any, userName: string): Promise<string> {
    const html = buildArtHtml(art, userName);
    const fileName = this.buildArtFileName(art, userName);
    const dir = path.join(this.uploadsBase, 'arts');

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, fileName);
    await this.htmlToPdf(html, filePath);

    return `/uploads/arts/${fileName}`;
  }

  private async htmlToPdf(html: string, outputPath: string): Promise<void> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });
    } catch (err) {
      throw new InternalServerErrorException(`Error generando PDF: ${err}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  private buildArtFileName(art: any, userName: string): string {
    const nombre = userName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '')
      .toUpperCase();
    const fecha = String(art.fecha).replace(/\//g, '-');
    const num = String(art.numeroDia ?? 1).padStart(3, '0');
    return `ART_${nombre}_${fecha}_${num}.pdf`;
  }
}
