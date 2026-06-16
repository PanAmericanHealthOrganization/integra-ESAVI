import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsOptional()
  nombre: string;

  @IsString()
  @IsOptional()
  inicialesNombre: string;

  @IsString()
  @IsOptional()
  identificacion: string;

  @IsString()
  @IsOptional()
  sexoPaciente: string;

  @IsString()
  @IsOptional()
  autoIdentificacionPaciente: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento: Date;

  @IsUUID()
  @IsOptional()
  generoId?: string;
}
