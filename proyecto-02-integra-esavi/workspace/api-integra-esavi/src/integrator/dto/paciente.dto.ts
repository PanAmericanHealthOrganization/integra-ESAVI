import {PartialType} from "@nestjs/swagger";
import {IsDateString,IsOptional,IsString} from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsOptional()
  nombre: string;

  @IsString()
  @IsOptional()
  apellidos: string;

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

  @IsOptional()
  origenOriginal: Record<string, any>;
}

export class UpdatePacienteDto extends PartialType(CreatePacienteDto) {}
