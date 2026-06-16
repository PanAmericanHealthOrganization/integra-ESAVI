import { PartialType } from '@nestjs/swagger';
import { CreateEtniaDto } from './create-etnia.dto';

export class UpdateEtniaDto extends PartialType(CreateEtniaDto) {}
