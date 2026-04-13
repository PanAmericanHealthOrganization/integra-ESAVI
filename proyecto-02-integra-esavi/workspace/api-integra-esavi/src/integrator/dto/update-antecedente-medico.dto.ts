import { PartialType } from '@nestjs/swagger';
import { CreateAntecedenteMedicoDto } from './create-antecedente-medico.dto';

export class UpdateAntecedenteMedicoDto extends PartialType(
  CreateAntecedenteMedicoDto,
) {}
