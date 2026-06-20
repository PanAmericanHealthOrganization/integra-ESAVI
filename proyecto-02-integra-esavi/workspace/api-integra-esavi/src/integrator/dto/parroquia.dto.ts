import { PartialType } from '@nestjs/swagger';
import { IsString, Length, MaxLength } from 'class-validator';

export class CreateParroquiaDto {
  @IsString()
  @Length(6, 6)
  codigo: string;

  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @Length(4, 4)
  cantonCodigo: string;
}

export class UpdateParroquiaDto extends PartialType(CreateParroquiaDto) {}
