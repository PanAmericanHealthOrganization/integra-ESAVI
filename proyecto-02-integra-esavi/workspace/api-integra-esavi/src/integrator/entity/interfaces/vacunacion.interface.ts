import { IVacuna } from './vacuna.interface';
export interface IVacunacion {
  id: string;
  vacuna: IVacuna;
  fechaVacunacion: Date;
  establecimiento: string;
  lote: string;
  dosis: number;
}
