import {PartialType} from "@nestjs/swagger";

export class CreateAntecedentePreexistenciaDto {
  descripcion: string;
  codigoEsaviCIE10: string;
}

export class UpdateAntecedentePreexistenciaDto extends PartialType(CreateAntecedentePreexistenciaDto) {}
