import { PartialType } from '@nestjs/swagger';
import { CreateGravedadEsaviDto } from './create-gravedad-esavi.dto';

export class UpdateGravedadEsaviDto extends PartialType(
  CreateGravedadEsaviDto,
) {}
