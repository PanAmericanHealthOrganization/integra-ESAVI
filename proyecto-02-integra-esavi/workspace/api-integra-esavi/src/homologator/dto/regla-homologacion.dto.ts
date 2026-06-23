import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { TipoComparacion } from '../enum/tipo-comparacion.enum';

export class CrearReglaHomologacionDto {
  @IsUUID()
  @IsNotEmpty()
  homologadorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sourceSystem: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sourceField: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sourceValue: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  targetValue: string;

  @IsEnum(TipoComparacion)
  @IsOptional()
  comparisonType?: TipoComparacion;

  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class ActualizarReglaHomologacionDto extends PartialType(CrearReglaHomologacionDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
