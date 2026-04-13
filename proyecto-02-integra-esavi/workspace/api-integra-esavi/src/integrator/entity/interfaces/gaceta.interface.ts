export enum ESTADO_GACETA {
  PUBLICADO = 'PUBLICADO',
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  CANCELADO = 'CANCELADO',
}
export interface IGaceta {
  id?: string;
  fechaPublicacion: Date;
  numeroGaceta: number;
  volumen: number;
  desde: Date;
  hasta: Date;
  urlGaceta: string;
  estado: ESTADO_GACETA;
  autor: string;
  cargo: string;
  titulo: string;
  autorSecundario: string;
  cargoSecundario: string;
  resumenContenido: string;

  analisisPoblacion: string;
  analisisDistribucionGeografica: string;
  analisisDistribucionTipoEvento: string;
  analisisDistribucionVacunas: string;
  analisisPorGravedad: string;
  analisisTemporal: string;

  conclusiones: string;
  recomendaciones: string;
}
