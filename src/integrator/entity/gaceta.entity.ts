import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ESTADO_GACETA, IGaceta } from './interfaces/gaceta.interface';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TG_GACETA',
  comment: 'contiene las partes configurables de la generación de la gaceta',
})
export class Gaceta implements IGaceta {
  /**
   * Primary generated column of gaceta
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'GACETA_ID',
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
   *
   */
  @Column({ name: 'ANIO', type: 'int', comment: 'Año de la gaceta' })
  anio: number;

  /**
   *
   */
  @Column({ name: 'MES', type: 'int', comment: 'Mes de la gaceta' })
  mes: number;

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
   * Análisis de gravedad con soporte para texto enriquecido/HTML
   */
  @Column({
    name: 'ANALISIS_GRAVEDAD',
    type: 'text',
    comment: 'Análisis de gravedad de la gaceta (soporta HTML/texto enriquecido)',
  })
  analisisGravedad: string;

  /**
   * Análisis de sexo y edad con soporte para texto enriquecido/HTML
   */
  @Column({
    name: 'ANALISIS_SEXO_EDAD',
    type: 'text',
    comment: 'Análisis de sexo y edad de la gaceta (soporta HTML/texto enriquecido)',
  })
  analisisSexoEdad: string;

  /**
   * Análisis de tipo de evento con soporte para texto enriquecido/HTML
   */
  @Column({
    name: 'ANALISIS_TIPO_EVENTO',
    type: 'text',
    comment: 'Análisis de tipo de evento de la gaceta (soporta HTML/texto enriquecido)',
  })
  analisisTipoEvento: string;

  /**
   * Análisis geográfico con soporte para texto enriquecido/HTML
   */
  @Column({
    name: 'ANALISIS_GEOGRAFICO',
    type: 'text',
    comment: 'Análisis geográfico de la gaceta (soporta HTML/texto enriquecido)',
  })
  analisisGeografico: string;

  /**
   * Resumen del contenido con soporte para texto enriquecido/HTML
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
