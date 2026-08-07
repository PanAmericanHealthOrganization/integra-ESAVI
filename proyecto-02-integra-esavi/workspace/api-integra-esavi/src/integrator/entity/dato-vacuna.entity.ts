import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {CatalogoPadre} from './catalogo-padre.entity';
import {DatoVacunacion} from './dato-vacunacion.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_DATO_VACUNA',
  comment: 'Tabla de datos de vacuna aplicada',
})
export class DatoVacuna extends Auditoria {
  /**
   * Primary generated column of dato vacuna
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador PK de la tabla TR_DATO_VACUNA' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'CODIGO_ATC',
    nullable: true,
    comment: 'Código ATC (Anatomical Therapeutic Chemical) de la vacuna',
  })
  codigoAtc: string;// Utilizado por vf.

  /**
   *
   */
  @ManyToOne(() => CatalogoPadre)
  @JoinColumn({ name: 'CT_ROL_VACUNA_ID' })
  rolVacuna: CatalogoPadre;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'SISTEMA_DE_CODIFICACION',
    nullable: true,
    default: 'WHODrug', //Actualmente se autocompleta con WHODrug
    comment: 'Sistema de codificación utilizado (WHODrug, ATC, etc.)',
  })
  sistemaDeCodificacion: string;// utilizado por vf y d2.

  /**
   *
   */
  @Column({
    name: 'DRUG_CODE',
    nullable: true,
    comment: 'Código WHODrug de la vacuna (DRUG.DRU_CODE)',
  })
  drugCode: string;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'DRUG_NAME',
    nullable: true,
    comment:
      'Nombre ESTANDARIZADO de la vacuna según WHODrug (DRUG.DRU_NAME). Solo se puebla cuando la homologación WHODrug encuentra coincidencia; el nombre con el que se reportó la vacuna vive en NOMBRE_VACUNA_REPORTADO.',
  })
  drugName: string;// utilizado por vf.

  /**
   * Nombre original de la vacuna, previo a la homologación WHODrug. Antes DRUG_NAME se
   * inicializaba con este valor y luego el match WHODrug lo sobrescribía, de modo que el dato
   * tal como lo reportó la fuente se perdía y no quedaba forma de auditar la homologación.
   */
  @Column({
    name: 'NOMBRE_VACUNA_REPORTADO',
    nullable: true,
    comment:
      'Nombre de la vacuna tal como lo entrega la fuente, sin homologar. VigiFlow: columna "Patente WHODrug". DHIS2: "Antecedente vacuna N".',
  })
  nombreVacunaReportado: string;// utilizado por vf y d2.

  /**
   *
   */
  @Column({
    name: 'MEDICINAL_PRODUCT_ID',
    nullable: true,
    comment: 'Identificador del producto medicinal en el país de venta (COUNTRY_SALES.COS_MEDICINAL_PRODUCT_ID)',
  })
  medicinalProductId: string;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'MA_HOLDER',
    nullable: true,
    comment: 'Titular del registro sanitario. MAH (Marketing Authorization Holder), tomado de WHODrug (MAHOLDER.NAME)',
  })
  maHolder: string;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'MA_HOLDER_MEDI_PROD_ID',
    nullable: true,
    comment: 'Identificador del producto medicinal asociado al titular del registro (MAHOLDER.MEDICINAL_PRODUCT_ID)',
  })
  maHolderMedicinalProductId: string;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'NUMERO_DOSIS_VACUNA',
    nullable: true,
    comment: 'Número de dosis de la vacuna administrada',
  })
  numeroDosisVacuna: number; // utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'DOSIS_ADMINISTRADA',
    nullable: true,
    comment: 'Dosis administrada de la vacuna',
  })
  dosis: string;// utilizado por vf.



  /**
   *
   */
  @Column({
    name: 'NUMERO_LOTE',
    nullable: true,
    comment: 'Número de lote de la vacuna',
  })
  numeroLote: string;// utilizado por vf y d2.

  /**
   *
   */
  @Column({
    name: 'FECHA_VENCIMIENTO_VACUNA',
    type: 'timestamptz', // con el tipo 'timestamptz' se forza a UTC.
    nullable: true,    
    comment: 'Fecha de vencimiento de la vacuna',
  })
  fechaVencimientoVacuna: Date; // utilizado por d2.

  /**
   *
   */
  @Column({
    name: 'NOMBRE_DILUYENTE_VACUNA',
    nullable: true,
    comment: 'Nombre del diluyente utilizado para la vacuna. Origen VigiFlow: hoja AEFI, columna "Nombre del diluyente"',
  })
  nombreDiluyenteVacuna: string; // utilizado por vf y d2.

  /**
   *
   */
  @Column({
    name: 'NUMERO_LOTE_DILUYENTE',
    nullable: true,
    comment: 'Número de lote del diluyente. Origen VigiFlow: hoja AEFI, columna "Número de lote del diluyente"',
  })
  numeroLoteDiluyente: string; // utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'FECHA_VENCIMIENTO_DILUYENTE',
    type: 'timestamptz', // con el tipo 'timestamptz' se forza a UTC.
    nullable: true,
    comment: 'Fecha de vencimiento del diluyente',
  })
  fechaVencimientoDiluyente: Date; // utilizado por d2.

  /**
   *
   */
  @Column({
    name: 'PAIS_AUTORIZACION_ISO3CODE', // 'PAIS_AUTORIZACION',
    nullable: true,
    comment: 'País que autorizó la comercialización de la vacuna. Identifica de forma única el país donde se comercializa o registra el medicamento. Utiliza el código ISO 3166-1 alfa-3 de tres letras para representar el país.',
  })
  paisAutorizacionIso3Code: string; //paisAutorizacion // utilizado por vf.







  // DURACION_TRATAMIENTO se eliminó: no aporta valor al análisis (una vacuna se administra en
  // un acto único, no es un tratamiento con duración) y solo lo poblaba VigiFlow.

  /**
   *
   */
  @Column({
    name: 'FORMA_FARMACEUTICA',
    nullable: true,
    comment: 'Forma farmacéutica de la vacuna',
  })
  formaFarmaceutica: string; // utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'FORMA_FARMACEUTICA_EDQM',
    nullable: true,
    comment: 'Forma farmacéutica según estándares EDQM',
  })
  formaFarmaceuticaEDQM: string; // utilizado por vf.
  /**
   *
   */
  @Column({
    name: 'VIA_ADMINISTRACION',
    nullable: true,
    comment: 'Vía de administración de la vacuna',
  })
  viaAdministracion: string; // utilizado por vf y d2.
  /**
   *
   */
  @Column({
    name: 'VIA_ADMINISTRACION_EDQM',
    nullable: true,
    comment: 'Vía de administración según estándares EDQM',
  })
  viaAdministracionEDQM: string; // utilizado por vf.

  @ManyToOne(() => DatoVacunacion, (dv) => dv.datosVacuna, { nullable: true })
  @JoinColumn({ name: 'DATO_VACUNACION_ID' })
  datoVacunacion: DatoVacunacion;

}
