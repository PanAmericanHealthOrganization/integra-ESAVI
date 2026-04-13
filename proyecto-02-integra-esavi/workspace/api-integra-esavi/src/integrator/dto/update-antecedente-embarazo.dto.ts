import { PartialType } from '@nestjs/swagger';
import { CreateAntecedenteEmbarazoDto } from './create-antecedente-embarazo.dto';

export class UpdateAntecedenteEmbarazoDto extends PartialType(
  CreateAntecedenteEmbarazoDto,
) {}
