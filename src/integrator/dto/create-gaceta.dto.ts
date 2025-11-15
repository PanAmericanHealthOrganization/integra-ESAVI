import { PartialType } from '@nestjs/swagger';
import { GacetaDto } from './gaceta.dto';

export class CreateGacetaDto extends PartialType(GacetaDto) {}
