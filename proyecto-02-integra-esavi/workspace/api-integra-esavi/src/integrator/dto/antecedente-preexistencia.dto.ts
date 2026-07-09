import {PartialType} from "@nestjs/swagger";

export class CreateAntecedentePreexistenciaDto {
  descripcion: string;
  codigoEsaviCIE10: string;
  ctLltMeddraId: number;
}

export class UpdateAntecedentePreexistenciaDto extends PartialType(CreateAntecedentePreexistenciaDto) {}
