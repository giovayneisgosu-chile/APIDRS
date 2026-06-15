// ────────────────────────────────────────────────────────────────
// Coordenadas del formato "Registro Individual de Entrega de EPP"
// Consorcio DRS FDA – CS-003-P-SSO-7-00001 (carta 612x792)
// Origen (0,0) = esquina INFERIOR izquierda. Unidad: puntos PDF.
// ────────────────────────────────────────────────────────────────

export const EPP_CABECERA = {
  nombre: { xc: 329, y: 610, size: 8, maxW: 300 },  // centrado en campo nombre (178-480)
  numero: { xc: 531, y: 610, size: 8, maxW: 75 },   // celda Nº centrada (485-577)
  cargo:  { x: 63,   y: 596, size: 8, maxW: 350 },  // tras "Cargo:"
  rut:    { xc: 458, y: 596, size: 7.5, maxW: 52 }, // celda RUT centrada (432-485)
  fecha:  { xc: 556, y: 596, size: 7.5, maxW: 45 }, // celda Fecha centrada (535-577)
};

// Tabla de 20 filas. Columnas por su X de inicio (o centro para campos cortos).
export const EPP_TABLA = {
  // bordes verticales medidos: 33|47|233|324|360|396|451|486|521|577
  col: {
    epp:      { x: 51,    size: 6.5, maxW: 180 }, // Elemento Protección Personal (47-233)
    marca:    { x: 237,   size: 6.5, maxW: 85 },  // Marca/Modelo (233-324)
    cant:     { xc: 342,  size: 6.5 },            // Cant. (324-360) centrado
    talla:    { xc: 378,  size: 6.5 },            // Talla (360-396) centrado
    fecha:    { xc: 423,  size: 6 },              // Fecha (396-451) centrado
    firma:    { xc: 468,  maxW: 34, maxH: 15 },   // Firma imagen (451-486)
    recambio: { xc: 503,  size: 6 },              // Recambio/Fecha (486-521) centrado
    firma2:   { xc: 549,  maxW: 34, maxH: 15 },   // Firma2 imagen (521-577)
  },
  filasY: [533.6, 515.8, 498.0, 480.2, 462.5, 444.7, 427.0, 409.2, 391.5, 373.7,
           355.9, 338.2, 320.4, 302.6, 284.9, 267.1, 249.4, 231.6, 213.8, 196.2],
  dyTexto: -2.5,
  rowH: 17.8,
};

export const EPP_PIE = {
  entregadoPor: { x: 243, y: 152, size: 8, maxW: 150 }, // tras "Entregado Por:"
  rut:          { x: 243, y: 137, size: 8, maxW: 150 }, // tras "RUT:"
  cargo:        { x: 243, y: 113, size: 8, maxW: 150 }, // tras "CARGO:"
  firma:        { xc: 486, yc: 135, maxW: 175, maxH: 65 }, // Firma persona trabajadora
};
