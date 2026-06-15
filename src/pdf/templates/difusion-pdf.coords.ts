// ─────────────────────────────────────────────────────────────
// Coordenadas calibradas — Difusión DRS/FDA (Letter 612x792 pts)
// Origen (0,0) = esquina INFERIOR izquierda.
// ─────────────────────────────────────────────────────────────

export const DATOS = {
  tipoActividad: {
    charlaSeg:  { xc: 200, y: 697 },
    capacitacion: { xc: 310, y: 697 },
    reflexion:  { xc: 410, y: 697 },
    reunion:    { xc: 495, y: 697 },
  },
  modalidad: {
    interna:  { xc: 168, y: 678 },
    externa:  { xc: 218, y: 678 },
  },
  asistencia: {
    presencial: { xc: 425, y: 678 },
    elearning:  { xc: 497, y: 678 },
  },
  relator:   { x: 148, y: 660, size: 8, maxW: 170 },
  rut:       { x: 398, y: 660, size: 8, maxW: 170 },
  cargo:     { x: 148, y: 641, size: 8, maxW: 170 },
  ubicacion: { x: 420, y: 641, size: 8, maxW: 148 },
};

// Tema principal: líneas de texto libre
export const TEMA = {
  x: 33, yInicio: 607, size: 8, lineH: 13, maxW: 548, maxLineas: 8,
};

// Lista de participantes: 15 filas por página
export const PARTICIPANTES = {
  yInicio: 467,
  lineH: 17.3,
  numX:      33,
  nombreX:   58,   nombreMaxW: 128,
  rutX:      198,  rutMaxW:    82,
  cargoX:    292,  cargoMaxW:  82,
  proyectoX: 386,  proyectoMaxW: 96,
  firmaXc:   540,  firmaMaxW:  64,  firmaMaxH: 14,
  size: 7,
};

// Footer
export const FOOTER = {
  numParticipantes: { x: 120, y: 190, size: 8 },
  fecha:            { x: 340, y: 190, size: 8 },
  horaInicio:       { x: 120, y: 174, size: 8 },
  horaTermino:      { x: 370, y: 174, size: 8 },
  duracion:         { x: 120, y: 158, size: 8 },
  hhTotales:        { x: 370, y: 158, size: 8 },
  firmaRelator:     { xc: 530, y: 162, maxW: 80, maxH: 18 },
};
