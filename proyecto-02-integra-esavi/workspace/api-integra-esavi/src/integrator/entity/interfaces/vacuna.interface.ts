export interface IVacuna {
  id: string;
  nombre: string;
  fabricante: string;
  paisOrigen: string;
  viaAdministracion: string;
  dosisRequeridas: number;
  intervaloDosis: number; // in days
  tipoVacuna: string; // e.g., mRNA, vector, inactivated
  fechaAprobacion: Date;
}
