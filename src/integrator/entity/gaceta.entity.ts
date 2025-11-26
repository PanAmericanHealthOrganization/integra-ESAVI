import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { ESTADO_GACETA, IGaceta } from './interfaces/gaceta.interface';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TG_GACETA',
  comment: 'contiene las partes configurables de la generación de la gaceta',
})
export class Gaceta extends Auditoria implements IGaceta {
  /**
   * Primary generated column of gaceta
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único de la gaceta',
  })
  id: string;

  /**
   *
   */
  @Column({ name: 'FECHA_PUBLICACION', type: 'date', comment: 'Fecha de publicación de la gaceta' })
  fechaPublicacion: Date;

  /**
   *
   */
  @Column({ name: 'NUMERO_GACETA', type: 'int', comment: 'Número de la gaceta' })
  numeroGaceta: number;

  /**
   *
   */
  @Column({ name: 'VOLUMEN', type: 'int', comment: 'Volumen de la gaceta' })
  volumen: number;

  /**
   * Column  of gaceta
   */
  @Column({ name: 'DESDE', type: 'date', comment: 'Fecha desde de la gaceta' })
  desde: Date;

  /**
   * Column  of gaceta
   */
  @Column({ name: 'HASTA', type: 'date', comment: 'Fecha hasta de la gaceta' })
  hasta: Date;

  /**
   *
   */
  @Column({ name: 'URL_GACETA', comment: 'URL de la gaceta' })
  urlGaceta: string;

  /**
   * Estado de la gaceta
   */
  @Column({
    name: 'ESTADO',
    type: 'enum',
    enum: ESTADO_GACETA,
    comment: 'Estado actual de la gaceta',
    default: ESTADO_GACETA.PENDIENTE,
  })
  estado: ESTADO_GACETA;

  /**
   *
   */
  @Column({ name: 'AUTOR', comment: 'Autor de la gaceta' })
  autor: string;

  /**
   *
   */
  @Column({ name: 'CARGO', comment: 'Cargo del autor' })
  cargo: string;

  /**
   *
   */
  @Column({ name: 'AUTOR_SECUNDARIO', comment: 'Autor secundario de la gaceta' })
  autorSecundario: string;

  /**
   *
   */
  @Column({ name: 'CARGO_SECUNDARIO', comment: 'Cargo del autor secundario' })
  cargoSecundario: string;

  /**
   * Column  of gaceta
   */
  @Column({
    name: 'TITULO',
    comment: 'Título de la gaceta',
    nullable: false,
    default: 'Gaceta',
  })
  titulo: string;

  /**
   *
   */
  @Column({
    name: 'ANALISIS_POBLACION',
    type: 'text',
    comment: 'Análisis de población',
    nullable: false,
    default: '',
  })
  analisisPoblacion: string;

  /**
   *
   */
  @Column({
    name: 'ANALISIS_DISTRIBUCION_GEOGRAFICA',
    type: 'text',
    comment: 'Análisis de distribución geográfica',
    nullable: false,
    default: '',
  })
  analisisDistribucionGeografica: string;

  /**
   *
   */
  @Column({
    name: 'ANALISIS_DISTRIBUCION_TIPO_EVENTO',
    type: 'text',
    comment: 'Análisis de distribución de tipo de evento',
    nullable: false,
    default: '',
  })
  analisisDistribucionTipoEvento: string;

  /**
   *
   */
  @Column({
    name: 'ANALISIS_DISTRIBUCION_VACUNAS',
    type: 'text',
    comment: 'Análisis de distribución de vacunas',
    nullable: false,
    default: '',
  })
  analisisDistribucionVacunas: string;

  /**
   *
   */
  @Column({
    name: 'ANALISIS_POR_GRAVEDAD',
    type: 'text',
    comment: 'Análisis por gravedad',
    nullable: false,
    default: '',
  })
  analisisPorGravedad: string;

  /**
   *
   */
  @Column({
    name: 'ANALISIS_TEMPORAL',
    type: 'text',
    comment: 'Análisis temporal',
    nullable: false,
    default: '',
  })
  analisisTemporal: string;
  /**
   * Resumen del contenido con soporte para texto enriquecido/HTML
   */
  /**
   *
   */
  @Column({
    name: 'RESUMEN_CONTENIDO',
    type: 'text',
    comment: 'Resumen del contenido de la gaceta (soporta HTML/texto enriquecido)',
  })
  resumenContenido: string;

  /**
   * Conclusiones con soporte para texto enriquecido/HTML
   */
  /**
   *
   */
  @Column({
    name: 'CONCLUSIONES',
    type: 'text',
    comment: 'Conclusiones de la gaceta (soporta HTML/texto enriquecido)',
  })
  conclusiones: string;

  /**
   * Recomendaciones con soporte para texto enriquecido/HTML
   */
  @Column({
    name: 'RECOMENDACIONES',
    type: 'text',
    comment: 'Recomendaciones de la gaceta (soporta HTML/texto enriquecido)',
  })
  recomendaciones: string;
}
