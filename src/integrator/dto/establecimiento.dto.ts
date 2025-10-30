import { IEstablecimiento } from '../entity/interfaces/establecimiento';

export class EstablecimientoDto implements IEstablecimiento {
  id: string;
  uniCodigo: string;
  uniNombre: string;
  provinciaCodigo: string;
  provinciaDescripcion: string;
  cantonCodigo: string;
  cantonDescripcion: string;
  parroquiaCodigo: string;
  parroquiaDescripcion: string;
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

export class EstablecimientoCreateDto implements Partial<IEstablecimiento> {
  id: string;
  uniCodigo: string;
  uniNombre: string;
  provinciaCodigo: string;
}

export class EstablecimientoUpdateDto implements Partial<IEstablecimiento> {
  uniCodigo: string;
}
