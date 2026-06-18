import {PartialType} from "@nestjs/swagger";
import {IsOptional,IsString,MaxLength} from 'class-validator';

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
}

export class UpdateParametroDto extends PartialType(CreateParametroDto) {}
