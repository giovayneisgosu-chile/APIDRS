export class ControlDto {
  id: string;
  label: string;
  aplica: string;
}

export class RiesgoCriticoDto {
  rcNum: number;
  seleccionado: boolean;
  controles: ControlDto[];
}

export class OtroRiesgoDto {
  riesgo: string;
  medidaControl: string;
}

export class ParticipanteDto {
  nombre: string;
  cargo: string;
  enCondiciones: string;
  firma: string;
}

export class CreateArtDto {
  // PASO 1
  supervisorAsignador: string;
  empresa: string;
  gerencia: string;
  superintendencia: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  lugarEspecifico: string;
  trabajoARealizar: string;

  // PASO 2A — Supervisor
  supTieneEstandar: string;
  supNombreEstandar?: string;
  supPersonalCapacitado: string;
  supSolicitoPermisos: string;
  supVerificoSegregacion: string;
  supPersonalComunicacion: string;
  supPersonalEPP: string;

  // PASO 2A — Trabajador
  trabConoceEstandar: string;
  trabNombreEstandar?: string;
  trabTieneCompetencias: string;
  trabTieneAutorizacion: string;
  trabSegrego: string;
  trabConoceEmergencia: string;
  trabUsaEPP: string;

  // PASO 2B
  riesgosCriticos: RiesgoCriticoDto[];

  // PASO 3
  otrosRiesgos: OtroRiesgoDto[];

  // PASO 4
  trabajosSimultaneos: string;
  contextoSimultaneo?: string;
  coordinacionLider?: string;
  verificacionCruzada?: string;
  comunicacionAcciones?: string;

  // PASO 5
  liderNombre: string;
  liderCargo: string;
  liderVerificoCondiciones: string;
  liderFirma?: string;
  participantes: ParticipanteDto[];
}
