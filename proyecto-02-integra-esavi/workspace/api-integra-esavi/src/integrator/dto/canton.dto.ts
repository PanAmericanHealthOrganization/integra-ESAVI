import { PartialType } from '@nestjs/swagger';
import { IsString, Length, MaxLength } from 'class-validator';

export class CreateCantonDto {
  @IsString()
  @Length(4, 4)
  codigo: string;

  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @Length(2, 2)
  provinciaCodigo: string;
}

export class UpdateCantonDto extends PartialType(CreateCantonDto) {}
