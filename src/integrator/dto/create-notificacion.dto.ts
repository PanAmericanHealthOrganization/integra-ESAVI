import { Optional } from '@nestjs/common';
import { Catalogo } from '../entity/catalogo.entity';
import { UbicacionDto } from './ubicacion.dto';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class CreateNotificacionDto {
  residenciaPaciente: UbicacionDto;
  peso: number;
  altura: number;
  @IsDate({ message: 'fechaNacimiento debe ser una fecha válida' })
  @Type(() => Date)  // ¡Esto es clave!
  fechaNacimiento: Date;
  edad: number;
  lactando : boolean;
  unidadEdadPaciente: string;
  grupoEtarioPaciente: string;
  identificacionNotificador : string;
  profesionNotificadorParam: string ;
  tituloNotificador: string;
  organizacion: string;
  organizacionUnitCode : string;
  organizacionUnit : string;
  delegadoOrganizacion : string;
  nombreNotificador: string;
  residenciaNotificador: UbicacionDto;
  comentarioNotificador: string;
  casoNarrativo: string;
  tituloReporte: string;
  tipoReporte: string;
  medioNotificacion: string;
  tipoEmisor: string;
  organizacionEmisor: string;
  nombreEmisor: string;
  estadoRegistroParam: string;
  @IsDate({ message: 'fechaNotificacion debe ser una fecha válida' })
  @Type(() => Date)  // ¡Esto es clave!
  fechaNotificacion: Date;
  fechaReporteNacional: Date;
  fechaLlenadoFicha: Date;
  fechaAtencion: Date;
  antecedenteEventoPrevio : number;
  antecedenteVacunal : number;
  codigoVigiflow?: string;
  codigoDhis2Evento?: string;
  ultimaEdicionRegistrada: string;
  codigoUnidadSalud : string;
  monitorioEstablecimientoSalud : number;
  constructor() {
    this.residenciaNotificador = new UbicacionDto();
    this.residenciaPaciente = new UbicacionDto();
  }
}
