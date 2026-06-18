import { PartialType } from '@nestjs/mapped-types';
import { TipoCatalogo } from '../entity/tipo-catalogo.entity';

export class CreateCatalogoDto {
  padre: CreateCatalogoDto;
  tipoCatalogo: TipoCatalogo;
}

export class UpdateCatalogoDto extends PartialType(CreateCatalogoDto) {}
