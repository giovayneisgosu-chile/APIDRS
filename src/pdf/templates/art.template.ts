// Plantilla HTML legacy (Puppeteer). Reemplazada por ArtPdfPlantillaService (pdf-lib).
// Se mantiene para que pdf.service.ts compile durante la migración.
export function buildArtHtml(_art: any, _userName: string): string {
  return '<html><body>Plantilla migrada a pdf-lib.</body></html>';
}
