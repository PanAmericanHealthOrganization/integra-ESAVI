import { IsNumber, IsString } from 'class-validator';

export class CreateGrupoEtarioDto {
  @IsNumber()
  inicio: number;
  @IsNumber()
  fin: number;
  @IsString()
  descripcion: string;
}
