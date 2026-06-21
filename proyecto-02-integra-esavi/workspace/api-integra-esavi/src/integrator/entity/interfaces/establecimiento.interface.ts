import { IAuditoria } from '../auditoria.entity';
import { Parroquia } from '../parroquia.entity';

export interface IEstablecimiento extends IAuditoria {
  uniCodigo: string;
  uniNombre: string;
  parroquiaResidencia: Parroquia;
  zonaCodigo: string;
  zonaDescripcion: string;
  distritoCodigo: string;
  distritoDescripcion: string;
  circuitoCodigo: string;
  tipoEntidad: string;
  longitudGps: number;
  latitudGps: number;
  mail: string;
}
