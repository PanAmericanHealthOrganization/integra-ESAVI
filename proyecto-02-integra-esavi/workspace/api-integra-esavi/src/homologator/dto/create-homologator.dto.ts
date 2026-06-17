import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DataType } from '../enum/data-type.enum';

export class CreateHomologatorDto {
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

  @IsEnum(DataType)
  @IsOptional()
  targetType?: DataType;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
