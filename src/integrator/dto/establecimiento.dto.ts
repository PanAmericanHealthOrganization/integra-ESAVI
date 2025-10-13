import { IEstablecimiento } from '../entity/interfaces/establecimiento';

export class EstablecimientoDto implements IEstablecimiento {
  id: string;
  uni_codigo: string;
  uni_nombre: string;
  prv_codigo: string;
  prv_descripcion: string;
  can_codigo: string;
  can_descripcion: string;
  par_codigo: string;
  par_descripcion: string;
  zon_codigo: string;
  zon_descripcion: string;
  dis_codigo: string;
  dis_descripcion: string;
  cir_codigo: string;
  tipo_entidad: string;
  longps: string;
  latgps: string;
  mail: string;
}

export class EstablecimientoCreateDto implements Partial<IEstablecimiento> {
  id: string;
  uni_codigo: string;
  uni_nombre: string;
  prv_codigo: string;
}

export class EstablecimientoUpdateDto implements Partial<IEstablecimiento> {
  uni_codigo: string;
}
