import { CatalogoPadre } from '../catalogo-padre.entity';
import { Parroquia } from '../parroquia.entity';

export interface IEstablecimiento {
  id: string;
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
