import {PartialType} from "@nestjs/swagger";
import {IsOptional,IsString,IsUUID,MaxLength} from 'class-validator';

export class CreateCatalogoPadreDto {
  @IsString()
  @MaxLength(50)
  codigo: string;

  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  descripcion?: string;

  @IsUUID()
  @IsOptional()
  padreId?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}

export class UpdateCatalogoPadreDto extends PartialType(CreateCatalogoPadreDto) {}
