const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function generarGrilla(templatePath, outputPath) {
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const pages    = pdfDoc.getPages();

  console.log(`\nPlantilla: ${path.basename(templatePath)}`);
  console.log(`Páginas encontradas: ${pages.length}`);

  for (let i = 0; i < pages.length; i++) {
    const page   = pages[i];
    const { width, height } = page.getSize();
    console.log(`  Página ${i + 1}: ${width.toFixed(1)} x ${height.toFixed(1)} pts  (${(width/72*2.54).toFixed(1)} x ${(height/72*2.54).toFixed(1)} cm)`);

    const STEP     = 15;
    const COLOR    = rgb(1, 0, 0);
    const OPACITY  = 0.35;
    const FONT_SIZE = 7;

    for (let x = 0; x <= width; x += STEP) {
      page.drawLine({
        start: { x, y: 0 }, end: { x, y: height },
        thickness: x % 100 === 0 ? 0.6 : 0.3,
        color: COLOR, opacity: OPACITY,
      });
      page.drawText(String(Math.round(x)), { x: x + 1, y: height - FONT_SIZE - 1, size: FONT_SIZE, color: COLOR, opacity: 0.7 });
      page.drawText(String(Math.round(x)), { x: x + 1, y: 2, size: FONT_SIZE, color: COLOR, opacity: 0.7 });
    }

    for (let y = 0; y <= height; y += STEP) {
      page.drawLine({
        start: { x: 0, y }, end: { x: width, y },
        thickness: y % 100 === 0 ? 0.6 : 0.3,
        color: COLOR, opacity: OPACITY,
      });
      page.drawText(String(Math.round(y)), { x: 2, y: y + 1, size: FONT_SIZE, color: COLOR, opacity: 0.7 });
      page.drawText(String(Math.round(y)), { x: width - 18, y: y + 1, size: FONT_SIZE, color: COLOR, opacity: 0.7 });
    }
  }

  const outBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, outBytes);
  console.log(`Guardado: ${path.basename(outputPath)}\n`);
}

async function main() {
  const tplDir = path.join(__dirname, 'src', 'pdf', 'templates');
  await generarGrilla(
    path.join(tplDir, 'epp-drs.pdf'),
    path.join(__dirname, 'epp-drs_grilla.pdf'),
  );
  await generarGrilla(
    path.join(tplDir, 'epp-fda.pdf'),
    path.join(__dirname, 'epp-fda_grilla.pdf'),
  );
}

main().catch(console.error);
