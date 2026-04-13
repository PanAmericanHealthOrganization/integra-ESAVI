import { IAuditoria } from '../auditoria.entity';

export interface IEstablecimiento extends IAuditoria {
  uniCodigo: string;

  /**
   *
   */
  uniNombre: string;

  /**
   *
   */
  provinciaCodigo: string;

  /**
   *
   */
  provinciaDescripcion: string;

  /**
   *
   */
  cantonCodigo: string;

  /**
   *
   */
  cantonDescripcion: string;

  /**
   *
   */
  parroquiaCodigo: string;

  /**
   *
   */
  parroquiaDescripcion: string;

  /**
   *
   */
  zonaCodigo: string;

  /**
   *
   */
  zonaDescripcion: string;

  /**
   *
   */
  distritoCodigo: string;

  /**
   *
   */
  distritoDescripcion: string;

  /**
   *
   */
  circuitoCodigo: string;

  /**
   *
   */
  tipoEntidad: string;

  /**
   *
   */
  longitudGps: number;

  /**
   *
   */
  latitudGps: number;

  /**
   *
   */
  mail: string;
}
