import { PartialType } from '@nestjs/swagger';
import { CreateEmbarazoEsaviDto } from './create-embarazo-esavi.dto';

export class UpdateEmbarazoEsaviDto extends PartialType(
  CreateEmbarazoEsaviDto,
) {}
