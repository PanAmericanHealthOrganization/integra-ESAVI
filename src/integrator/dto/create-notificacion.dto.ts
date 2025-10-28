import { Optional } from '@nestjs/common';
import { Catalogo } from '../entity/catalogo.entity';
import { UbicacionDto } from './ubicacion.dto';

export class CreateNotificacionDto {
  residenciaPaciente: UbicacionDto;
  peso: number;
  altura: number;
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
  comentario: string;
  casoNarrativo: string;
  tituloReporte: string;
  tipoReporte: string;
  medioNotificacion: string;
  tipoEmisor: string;
  organizacionEmisor: string;
  nombreEmisor: string;
  estadoRegistroParam: string;
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
