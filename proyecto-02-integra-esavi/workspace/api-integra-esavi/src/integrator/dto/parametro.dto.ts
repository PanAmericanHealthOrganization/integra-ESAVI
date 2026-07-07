import {ApiPropertyOptional,PartialType} from "@nestjs/swagger";
import {IsBoolean,IsEnum,IsOptional,IsString,MaxLength} from 'class-validator';
import { TipoDato } from '../../homologator/enum/tipo-dato.enum';

export class CreateParametroDto {
  @IsString()
  @MaxLength(32)
  clave: string;

  @IsString()
  @IsOptional()
  valor: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  descripcion: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  modulo: string;

  @ApiPropertyOptional({ enum: TipoDato, default: TipoDato.STRING })
  @IsEnum(TipoDato)
  @IsOptional()
  tipo_dato: TipoDato;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  es_encriptado: boolean;
}

export class UpdateParametroDto extends PartialType(CreateParametroDto) {}
