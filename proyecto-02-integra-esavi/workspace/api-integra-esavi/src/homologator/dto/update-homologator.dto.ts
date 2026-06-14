import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DataType } from '../enum/data-type.enum';

export class UpdateHomologatorDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  entity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  field?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DataType)
  @IsOptional()
  targetType?: DataType;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
