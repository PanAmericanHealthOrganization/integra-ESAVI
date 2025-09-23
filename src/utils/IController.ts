import { IBaseEntity } from './interfaces/baseEntity';
import { GetListParams } from './interfaces/pagination';

export type Identificator = number | string;

/**
 * Interfaz básica para operaciones CRUD
 */
export interface BasesCRUD<C, R, U> {
  getOne(id: Identificator): Promise<R>;
  getMany(id: Identificator[]): Promise<R[]>;
  getPaginated(params: GetListParams): Promise<{ data: R[]; total: number }>;
  create(data: C): Promise<R>;
  update(id: Identificator, data: U): Promise<R>;
  delete(id: Identificator, auditData: any): Promise<R>;
}
/**
 * Interfaz básica para operaciones CRUD
 */

export interface IGetManyParams {
  ids: Identificator[];
  audit: IBaseEntity;
}

/**
 *
 */
export interface IController<C, R, U> extends Omit<BasesCRUD<C, R, U>, 'getMany'> {
  getMany(params: IGetManyParams): Promise<R[]>;
  delete(id: Identificator, auditData: any): Promise<R>;
}

/**
 * Interfaz básica para operaciones CRUD
 */
export interface IService<C, R, U> extends Omit<BasesCRUD<C, R, U>, 'getMany'> {
  exist(id: number | string): Promise<boolean>;
}
