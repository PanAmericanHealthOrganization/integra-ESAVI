import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { ComparisonType } from '../enum/comparison-type.enum';

export class CreateHomologationDto {
  @IsUUID()
  @IsNotEmpty()
  homologatorId: string;

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

  @IsEnum(ComparisonType)
  @IsOptional()
  comparisonType?: ComparisonType;

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
