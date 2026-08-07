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

  /** Snapshot del registro crudo de la fuente. Persiste en TR_PACIENTE.PAYLOAD_ORIGEN. */
  @IsOptional()
  payloadOrigen: Record<string, any>;
}

export class UpdatePacienteDto extends PartialType(CreatePacienteDto) {}
