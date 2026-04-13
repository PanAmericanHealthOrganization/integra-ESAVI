import { PickType } from '@nestjs/swagger';
import { GacetaDto } from './gaceta.dto';

export class CreateGacetaDto extends PickType(GacetaDto, ['desde', 'hasta', 'numeroGaceta'] as const) {}
