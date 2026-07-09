import {PartialType} from "@nestjs/swagger";

export class CreateAntecedenteEventoDto {
  antecedente: number;
  alergiaMedicamento: boolean;
  alergiaAlimentos: boolean;
  alergiaInsectos: boolean;
  alergiaPolvo: boolean;
  otrasAlergias: string;
}

export class UpdateAntecedenteEventoDto extends PartialType(CreateAntecedenteEventoDto) {}
