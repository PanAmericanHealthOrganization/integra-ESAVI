import { PartialType } from '@nestjs/swagger';
import { CreateAntecedenteEventoDto } from './create-antecedente-evento.dto';

export class UpdateAntecedenteEventoDto extends PartialType(
  CreateAntecedenteEventoDto,
) {}
