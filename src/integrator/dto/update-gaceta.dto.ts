import { OmitType } from '@nestjs/swagger';
import { CreateGacetaDto } from './create-gaceta.dto';

export class UpdateGacetaDto extends OmitType(CreateGacetaDto, [
  'id',
  'fechaPublicacion',
  'mes',
  'anio',
]) {}
