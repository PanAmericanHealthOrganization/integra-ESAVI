import { Parroquia } from '../parroquia.entity';

export interface IEstablecimiento {
  id: string;
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
