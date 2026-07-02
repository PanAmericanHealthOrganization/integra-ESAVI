import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn} from 'typeorm';
import {Auditoria} from './auditoria.entity';
import {Catalogo} from './catalogo.entity';
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
    name: 'DOSIS_DE_APLICACION',
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
