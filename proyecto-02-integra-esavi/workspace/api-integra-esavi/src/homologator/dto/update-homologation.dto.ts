import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ComparisonType } from '../enum/comparison-type.enum';

export class UpdateHomologationDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  sourceSystem?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sourceField?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceValue?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  targetValue?: string;

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
