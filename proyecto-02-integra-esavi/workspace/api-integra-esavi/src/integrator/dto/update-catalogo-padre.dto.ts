import { PartialType } from '@nestjs/swagger';
import { CreateCatalogoPadreDto } from './create-catalogo-padre.dto';

export class UpdateCatalogoPadreDto extends PartialType(CreateCatalogoPadreDto) {}
