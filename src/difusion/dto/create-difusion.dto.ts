export class ParticipanteDto {
  usuarioId: string;
  nombre: string;
  rut: string;
  cargo: string;
  proyecto: string;
  empresa: string;
}

export class CreateDifusionDto {
  tipoActividad: string;
  modalidad: string;
  asistencia: string;
  relator: string;
  rutRelator: string;
  cargo: string;
  ubicacion: string;
  temaPrincipal: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  duracion: string;
  hhTotales: string;
  firmaRelator?: string;
  participantes: ParticipanteDto[];
}
