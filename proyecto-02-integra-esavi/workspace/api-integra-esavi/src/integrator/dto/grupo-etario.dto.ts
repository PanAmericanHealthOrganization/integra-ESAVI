import {PartialType} from "@nestjs/swagger";
import {IsNumber,IsString} from 'class-validator';

export class CreateGrupoEtarioDto {
  @IsNumber()
  inicio: number;
  @IsNumber()
  fin: number;
  @IsString()
  unidadEdad: string;
  @IsString()
  descripcion: string;
}

export class UpdateGrupoEtarioDto extends PartialType(CreateGrupoEtarioDto) {}
