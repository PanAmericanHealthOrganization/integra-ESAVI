import { PartialType } from '@nestjs/swagger';
import { CreateGacetaDto } from './create-gaceta.dto';

export class UpdateGacetaDto extends PartialType(CreateGacetaDto) {}
