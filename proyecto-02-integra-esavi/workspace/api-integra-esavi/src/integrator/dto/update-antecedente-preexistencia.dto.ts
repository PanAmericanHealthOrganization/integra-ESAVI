import { PartialType } from '@nestjs/swagger';
import { CreateAntecedentePreexistenciaDto } from './create-antecedente-preexistencia.dto';

export class UpdateAntecedentePreexistenciaDto extends PartialType(
  CreateAntecedentePreexistenciaDto,
) {}
