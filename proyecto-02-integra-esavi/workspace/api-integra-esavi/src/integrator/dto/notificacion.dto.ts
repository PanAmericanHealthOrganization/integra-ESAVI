import {ApiProperty,PartialType} from "@nestjs/swagger";
import {Type} from 'class-transformer';
import {IsDate} from 'class-validator';
import {SourceEnum} from '../enum/source-enum';
import {UbicacionDto} from './ubicacion.dto';

export class CreateNotificacionDto {
  residenciaPaciente: UbicacionDto;
  peso: number;
  altura: number;
  @IsDate({ message: 'fechaNacimiento debe ser una fecha válida' })
  @Type(() => Date)
  fechaNacimiento: Date;
  edad: number;
  lactando: string;
  unidadEdadPaciente: string;
  grupoEtarioPaciente: string;
  identificacionNotificador: string;
  profesionNotificadorParam: string;
  tituloNotificador: string;
  organizacionNotificador: string;
  organizacionUnitCode: string;
  organizacionUnit: string;
  delegadoOrganizacion: string;
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
  @Type(() => Date)
  fechaNotificacion: Date;
  fechaReporteNacional: Date;
  fechaLlenadoFicha: Date;
  fechaAtencion: Date;
  antecedenteEventoPrevio: number;
  antecedenteVacunal: number;
  codigoVigiflow?: string;
  codigoDhis2Evento?: string;
  ultimaEdicionRegistrada: string;
  codigoUnidadSalud: string;
  monitorioEstablecimientoSalud: number;
  origenOriginal: Record<string, any>;
  constructor() {
    this.residenciaNotificador = new UbicacionDto();
    this.residenciaPaciente = new UbicacionDto();
  }
}

export class UpdateNotificacionDto extends PartialType(CreateNotificacionDto) {
  @ApiProperty({
    enum: SourceEnum,
    enumName: 'SourceEnum',
    default: SourceEnum.DHIS2,
  })
  source: SourceEnum;
  id: string;
  constructor() {
    super();
  }
}
