import { IAuditoria } from '../auditoria.entity';
import { CatalogoPadre } from '../catalogo-padre.entity';
import { Parroquia } from '../parroquia.entity';

export interface IEstablecimiento extends IAuditoria {
  uniCodigo: string;
  uniNombre: string;
  parroquiaResidencia: Parroquia;
  tipoEntidad: CatalogoPadre;
  direccion: string;
  telefono: string;
  longitudGps: number;
  latitudGps: number;
  mail: string;
}
