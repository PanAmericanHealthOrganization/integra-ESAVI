export interface IPoblacionVacunada {
  id: number;
  uniCodigo: string;
  fechaVacunacion: Date;
  sexo: string;
  edad: number;
  vacuna: string;
  lote: string;
  totalVacunados: number;
}

export class PoblacionVacunadaDto implements IPoblacionVacunada {
  id: number;
  uniCodigo: string;
  fechaVacunacion: Date;
  sexo: string;
  edad: number;
  vacuna: string;
  lote: string;
  totalVacunados: number;
}

export class PoblacionVacunadaCreateDto extends PoblacionVacunadaDto {}
export class PoblacionVacunadaUpdateDto {
  totalVacunados: number;
}
