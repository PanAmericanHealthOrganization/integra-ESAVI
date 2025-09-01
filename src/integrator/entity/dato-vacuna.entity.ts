import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Auditoria } from './auditoria.entity';
import * as moment from 'moment/moment';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_DATO_VACUNA',
  comment: 'Tabla de datos de vacuna aplicada',
})
export class DatoVacuna extends Auditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'DATOVACUNA_ID' })
  id: string;

  /**
   *
   */
  @Column({
    name: 'CODIGOATC',
    nullable: true,
    comment: 'Código ATC (Anatomical Therapeutic Chemical) de la vacuna',
  })
  codigoAtc: string;

  /**
   *
   */
  @Column({
    name: 'ROL_VACUNA',
    nullable: true,
    comment: 'Rol de la vacuna en el evento (sospechosa, concomitante, etc.)',
  })
  rolVacuna: string;

  /**
   *
   */
  @Column({
    name: 'SISTEMA_DE_CODIFICACION',
    nullable: true,
    default: 'WHUDRUG',
    comment: 'Sistema de codificación utilizado (WHUDRUG, ATC, etc.)',
  })
  sistemaDeCodificacion: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_VACUNA',
    nullable: true,
    comment: 'Nombre comercial de la vacuna administrada',
  })
  nombreVacuna: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_VACUNA_PATENTE_WHO_DRUG',
    nullable: true,
    comment: 'Nombre de patente de la vacuna según WHO Drug',
  })
  nombreVacunaPatenteWhoDrug: string;

  /**
   *
   */
  @Column({
    name: 'DRUG_CODE',
    nullable: true,
    comment: 'Código del medicamento en WHO Drug',
  })
  drugCode: string;

  /**
   *
   */
  @Column({
    name: 'MAHOLDERS_JSON',
    type: 'jsonb',
    nullable: true,
    comment: 'Datos JSON de los titulares de autorización de comercialización',
  })
  mahholdersJson: any;

  /**
   *
   */
  @Column({
    name: 'ACTIVE_INGREDENTS_JSON',
    type: 'jsonb',
    nullable: true,
    comment: 'Datos JSON de los ingredientes activos de la vacuna',
  })
  activeIngredientsJson: any;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_NORMALIZADO_VACUNA',
    nullable: true,
    comment: 'Nombre normalizado de la vacuna',
  })
  nombreVacunaNormalizada: string;

  /**
   *
   */
  @Column({
    name: 'PRINCIPIO_ACTIVO_WHO_DRUG',
    nullable: true,
    comment: 'Principio activo de la vacuna según WHODrug',
  })
  principioActivoWhoDrug: string;

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
    name: 'IDENTIFICADOR_VACUNA',
    nullable: true,
    comment: 'Identificador único de la vacuna',
  })
  identificadorVacuna: string;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_FABRICANTE',
    nullable: true,
    comment: 'Nombre del fabricante de la vacuna',
  })
  nombreFabricante: string;

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
  numeroDosisVacuna: number;

  /**
   *
   */
  @Column({
    name: 'DOSIS',
    nullable: true,
    comment: 'Dosis administrada de la vacuna',
  })
  dosis: string;

  /**
   *
   */
  @Column({
    name: 'DOSIS_1',
    nullable: true,
    comment: 'Primera dosis administrada',
  })
  dosis1: string;

  /**
   *
   */
  @Column({
    name: 'INTERVALO_DOSIFICACION',
    nullable: true,
    comment: 'Intervalo entre dosis de vacunación',
  })
  intervaloDosificacion: string;

  /**
   *
   */
  @Column({
    name: 'NUMERO_LOTE',
    nullable: true,
    comment: 'Número de lote de la vacuna',
  })
  numeroLote: string;

  /**
   *
   */
  @Column({
    name: 'FECHA_VENCIMIENTO_VACUNA',
    nullable: true,
    comment: 'Fecha de vencimiento de la vacuna',
  })
  fechaVencimientoVacuna: Date;

  /**
   *
   */
  @Column({
    name: 'NOMBRE_DILUYENTE_VACUNA',
    nullable: true,
    comment: 'Nombre del diluyente utilizado para la vacuna',
  })
  nombreDiluyenteVacuna: string;

  /**
   *
   */
  @Column({
    name: 'FECHA_VENCIMIENTO_DILUYENTE',
    nullable: true,
    comment: 'Fecha de vencimiento del diluyente',
  })
  fechaVencimientoDiluyente: Date;

  /**
   *
   */
  @Column({
    name: 'PAIS_AUTORIZACION',
    nullable: true,
    comment: 'País que autorizó la comercialización de la vacuna',
  })
  paisAutorizacion: string;

  /**
   *
   */
  @Column({
    name: 'CONCENTRACION',
    nullable: true,
    comment: 'Concentración de la vacuna administrada',
  })
  concentracion: string;

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
  accionTomada: string;

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
  indicacionMeddra: string;

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
  duracion: string;

  /**
   *
   */
  @Column({
    name: 'INICIO_ADMINISTRACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha y hora de inicio de administración de la vacuna',
  })
  inicioAdministracion: Date;

  /**
   *
   */
  @Column({
    name: 'FIN_ADMINISTRACION',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha y hora de fin de administración de la vacuna',
  })
  finAdministracion: Date;

  /**
   *
   */
  @Column({
    name: 'FORMA_FARMACEUTICA',
    nullable: true,
    comment: 'Forma farmacéutica de la vacuna',
  })
  formaFarmaceutica: string;

  /**
   *
   */
  @Column({
    name: 'FORMA_FARMACEUTICA_EDQM',
    nullable: true,
    comment: 'Forma farmacéutica según estándares EDQM',
  })
  formaFarmaceuticaEDQM: string;

  /**
   *
   */
  @Column({
    name: 'VIA_ADMINISTRACION',
    nullable: true,
    comment: 'Vía de administración de la vacuna',
  })
  viaAdministracion: string;

  /**
   *
   */
  @Column({
    name: 'VIA_ADMINISTRACION_EDQM',
    nullable: true,
    comment: 'Vía de administración según estándares EDQM',
  })
  viaAdministracionEDQM: string;

  @ManyToOne(() => Notificacion)
  @JoinColumn({ name: 'NOTIFICACION_ID' })
  notificacion: Notificacion;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = moment().toDate();
  }
}
