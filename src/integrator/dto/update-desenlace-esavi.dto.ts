import { PartialType } from '@nestjs/swagger';
import { CreateDesenlaceEsaviDto } from './create-desenlace-esavi.dto';

export class UpdateDesenlaceEsaviDto extends PartialType(
  CreateDesenlaceEsaviDto,
) {}
