import {format} from 'date-fns';
import { es } from 'date-fns/locale/es';
import {CreateGacetaDto} from '../dto/create-gaceta.dto';
import {GacetaDto} from '../dto/gaceta.dto';
import {ESTADO_GACETA} from '../entity/interfaces/gaceta.interface';

/**
 * 
 * @param createGacetaDto 
 * @returns 
 */
export const crearGacetaBasica = (createGacetaDto: CreateGacetaDto): GacetaDto => {
return {
  fechaPublicacion: new Date(),
  estado: ESTADO_GACETA.PENDIENTE,
  ...createGacetaDto,
  numeroGaceta: 0,
  volumen: 0,
  urlGaceta: '',
  autor: '',
  cargo: '',
  autorSecundario: '',
  cargoSecundario: '',
  titulo: `Análisis de Eventos Adversos en el Mes de ${format(createGacetaDto.desde, 'MMMM yyyy', { locale: es })}`,
  resumenContenido: '',
  analisisPoblacion: '',
  analisisDistribucionGeografica: '',
  analisisDistribucionTipoEvento: '',
  analisisDistribucionVacunas: '',
  analisisPorGravedad: '',
  analisisTemporal: '',
  conclusiones: '',
  recomendaciones: '',
};
};
