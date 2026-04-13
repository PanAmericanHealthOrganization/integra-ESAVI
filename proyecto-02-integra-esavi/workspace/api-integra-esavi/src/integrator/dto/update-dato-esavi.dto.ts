import { CreateDatoEsaviDto } from './create-dato-esavi.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateDatoEsaviDto extends PartialType(CreateDatoEsaviDto) {}
