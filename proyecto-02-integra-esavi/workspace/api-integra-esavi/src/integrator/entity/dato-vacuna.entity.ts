import * as moment from 'moment/moment';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Catalogo } from './catalogo.entity';
import { Notificacion } from './notificacion.entity';

@Entity({
  schema: 'dhi_esavi',
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
    name: 'CODIGOATC',
    nullable: true,
    comment: 'Código ATC (Anatomical Therapeutic Chemical) de la vacuna',
  })
  codigoAtc: string;// Utilizado por vf.

  /**
   *
   */
  @ManyToOne(() => Catalogo)
  @JoinColumn({ name: 'CT_ROL_VACUNA_ID' })
  rolVacuna: Catalogo;// utilizado por vf.

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
    name: 'NOMBRE_VAC_PATENTE_WHODRUG', // drugName //'NOMBRE_VACUNA_PATENTE_WHO_DRUG'
    nullable: true,
    comment: 'Nombre de la vacuna según la patente del estándar WHODrug',
  })
  nombreVacPatenteWHODrug: string; // utilizado por vf.
  /**
   *
   */
  @Column({
    name: 'DRUG_NAME',//'NOMBRE_VACUNA',
    nullable: true,
    comment: 'Nombre de la vacuna administrada, según el diccionario WHODrug Global de Uppsala Monitoring Centre.', //'Nombre comercial de la vacuna administrada',
  })
  drugName: string;//nombreVacuna: string; // utilizado por vf y d2.

  /**
   *
   */
  @Column({
    name: 'DRUG_CODE',
    nullable: true,
    comment: 'Código del medicamento en WHO Drug',
  })
  drugCode: string;//utilizado por vf.
  /**
   *
   */
  /*@Column({
    name: 'IDENTIFICADOR_VACUNA',
    nullable: true,
    comment: 'Identificador único de la vacuna',
  })
  identificadorVacuna: string;*/
  /**
   *
   */
  @Column({
    name: 'RID_MEDICINAL_PRODUCT_ID', //'IDENTIFICADOR_VACUNA',
    nullable: true,
    comment: 'Identifica de forma única el producto medicinal según los estándares de la EMA (Agencia Europea de Medicamentos) o la OMS. En WHODrug Global, el MPID (Medicinal Product Identifier) y el RID (Record Identifier) se consideran equivalentes o intercambiables al codificar porque ambos apuntan al nivel más alto y específico de un producto farmacéutico.',
  })
  medicinalProductId: string;
  /**
   * 
   */
  @Column({
    name: 'ES_GENERICO',
    nullable: true,
    comment: 'Marcador de registro Generico en WHODrug. Indica si la vacuna es genérica.',
  })
  esGenerico: string;

  /**
   *
   */
  @Column({
    name: 'MAHOLDER_JSONB',//'MAHOLDERS_JSON'
    type: 'jsonb',
    nullable: true,
    comment: 'Datos JSONB de los titulares de autorización de comercialización. MAH (Marketing Authorization Holder / Titular de la autorización de comercialización).',
  })
  maHolderJsonb: any;//mahholdersJson: any;

  /**
   *
   */
  @Column({
    name: 'ACTIVE_INGREDIENT_JSON', //Campo "ingredient" de WHODrug
    type: 'json', //type: 'jsonb',
    nullable: true,
    comment: 'Datos JSON de los ingredientes activos de la vacuna. Campo "ingredient" de WHODrug',
  })
  activeIngredientJson: any; // utilizado por vf.
  /**
   *
   */
  @Column({
    name: 'AC_INGREDIENT_TRANSLATION_JSON', //Campo "ingredient" de WHODrug
    type: 'json', //type: 'jsonb',
    nullable: true,
    comment: 'Datos en formato JSON de la traducción al idioma español ("es-ES") de los ingredientes activos de la vacuna. Campo "ingredientTranslations" de WHODrug',
  })
  acIngredientTranslationJson: any; // utilizado por vf.
  // En TypeScript el tipo 'any' es el más fácil y recomendable para manejar datos JSON dinámicos o desconocidos.
  /**
   *
   */
  /*@Column({
    name: 'NOMBRE_NORMALIZADO_VACUNA', //campo duplicado con 'NOMBRE_VAC_PATENTE_WHODRUG'
    nullable: true,
    comment: 'Nombre normalizado de la vacuna',
  })
  nombreVacunaNormalizada: string;*/

  /**
   *
   */
  /*@Column({
    name: 'PRINCIPIO_ACTIVO_WHO_DRUG', // Campo duplicado con 'ACTIVE_INGREDIENT_JSON'.
    nullable: true,
    comment: 'Principio activo de la vacuna según WHODrug',
  })
  principioActivoWhoDrug: string;*/

  /**
   *
   */
  @Column({
    name: 'CODIGO_VACUNA_OTRO',
    nullable: true,
    comment: 'Otro código alternativo de identificación de la vacuna',
  })
  codigoOtro: string;
  /**
   *
   */
  @Column({
    name: 'NOMBRE_FABRICANTE',
    nullable: true,
    comment: 'Nombre del fabricante de la vacuna',
  })
  nombreFabricante: string; // utilizado por d2.

  /**
   *
   */
  @Column({
    name: 'NOMBRE_FABRICANTE_WHO_DRUG',
    nullable: true,
    comment: 'Nombre del fabricante según WHODrug',
  })
  nombreFabricanteWhoDrug: string;

  /**
   *
   */
  @Column({
    name: 'CODIGO_FABRICANTE_WHO_DRUG',
    nullable: true,
    comment: 'Código del fabricante según WHODrug',
  })
  codigoFabricanteWhoDrug: string;

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
    name: 'DOSIS',
    nullable: true,
    comment: 'Dosis administrada de la vacuna',
  })
  dosis: string;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'DOSIS_1',
    nullable: true,
    comment: 'Primera dosis administrada',
  })
  dosis1: string;//utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'INTERVALO_DOSIFICACION',
    nullable: true,
    comment: 'Intervalo entre dosis de vacunación. Variable utilizada solo por VigiFlow.',
  })
  intervaloDosificacion: string; // utilizado por vf.

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
    comment: 'Nombre del diluyente utilizado para la vacuna',
  })
  nombreDiluyenteVacuna: string; // utilizado por d2.

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

  /**
   *
   */
  @Column({
    name: 'STRENGTH_POTENCIA', //'CONCENTRACION',
    nullable: true,
    comment: 'En WHODrug, el campo Strength o Potencia describe la cantidad del ingrediente activo por unidad de presentación, no siempre una concentración. Ejemplo, formas líquidas multidosis: Amoxicillin 250 mg/5 mL suspension, la concentración real sería 50 mg/mL. En WHODrug, la concentración se deduce, no se almacena como tal.',
  })
  strengthPotencia: string;//concentracion: string;

  /**
   *
   */
  @Column({
    name: 'INGREDIENTE_SOSPECHOSO',
    nullable: true,
    comment: 'Ingrediente sospechoso de causar el evento adverso',
  })
  ingredienteSospechoso: string;

  /**
   *
   */
  @Column({
    name: 'ACCION_TOMADA',
    nullable: true,
    comment: 'Acción tomada con respecto a la vacuna tras el evento',
  })
  accionTomada: string;// utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'INFORMACION_ADICIONAL_MEDICAMENTO',
    nullable: true,
    comment: 'Información adicional sobre el medicamento/vacuna',
  })
  informacionAdicionalMedicamento: string;

  /**
   *
   */
  @Column({
    name: 'INDICACION_MEDDRA',
    type: 'text',
    nullable: true,
    comment: 'Indicación de la vacuna codificada en MedDRA',
  })
  indicacionMeddra: string; // utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'INDICACION_NOTIFICADOR_PRIMARIO',
    type: 'text',
    nullable: true,
    comment: 'Indicación de la vacuna según el notificador primario',
  })
  indicacionNotificadorPrimario: string;

  /**
   *
   */
  @Column({
    name: 'DURACION_TRATAMIENTO',
    nullable: true,
    comment: 'Duración del tratamiento con la vacuna',
  })
  duracion: string; // utilizado por vf.

  /**
   *
   */
  @Column({
    name: 'INICIO_ADMINISTRACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha y hora de inicio de administración de la vacuna',
  })
  inicioAdministracion: Date; // utilizado por vf y d2.

  /**
   *
   */
  @Column({
    name: 'FIN_ADMINISTRACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha y hora de fin de administración de la vacuna',
  })
  finAdministracion: Date; // utilizado por vf.

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

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
