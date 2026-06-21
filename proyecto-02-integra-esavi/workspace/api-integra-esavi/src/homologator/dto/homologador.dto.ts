import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoDato } from '../enum/tipo-dato.enum';

export class CrearHomologadorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  entity: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  field: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TipoDato)
  @IsOptional()
  targetType?: TipoDato;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class ActualizarHomologadorDto extends PartialType(CrearHomologadorDto) {
  @IsString()
  @IsOptional()
  updatedBy?: string;
}

export class SolicitudResolucionDto {
  @IsString()
  @IsNotEmpty()
  entity: string;

  @IsString()
  @IsNotEmpty()
  field: string;

  @IsString()
  @IsNotEmpty()
  sourceSystem: string;

  @IsString()
  @IsNotEmpty()
  sourceValue: string;
}
