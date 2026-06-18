import { PartialType } from '@nestjs/mapped-types';

export class CreateAntecedentePreexistenciaDto {
  descripcion: string;
  codigoEsaviCIE10: string;
}

export class UpdateAntecedentePreexistenciaDto extends PartialType(CreateAntecedentePreexistenciaDto) {}
