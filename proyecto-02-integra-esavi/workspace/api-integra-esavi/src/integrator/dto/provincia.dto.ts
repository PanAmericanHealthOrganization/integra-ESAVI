import { PartialType } from '@nestjs/swagger';
import { IsString, Length, MaxLength } from 'class-validator';

export class CreateProvinciaDto {
  @IsString()
  @Length(2, 2)
  codigo: string;

  @IsString()
  @MaxLength(100)
  nombre: string;
}

export class UpdateProvinciaDto extends PartialType(CreateProvinciaDto) {}
