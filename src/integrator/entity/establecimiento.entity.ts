import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IEstablecimiento } from './interfaces/establecimiento.interface';
@Entity({
  name: 'TR_ESTABLECIMIENTO',
  schema: 'dhi_esavi',
  comment: 'Tabla de establecimientos de salud gestionados por el ministerio de salud publica',
})
export class Establecimiento implements IEstablecimiento {
  /**
   * Primary generated column of establecimiento
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ESTABLECIMIENTO_ID',
    comment: 'Identificador único del establecimiento',
  })
  id: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'UNI_CODIGO',
    comment: 'Código único del establecimiento',
    type: 'varchar',
    length: 10,
    unique: true,
  })
  uniCodigo: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'UNI_NOMBRE',
    comment: 'Nombre del establecimiento',
    type: 'varchar',
    length: 100,
  })
  uniNombre: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'PRV_CODIGO',
    type: 'varchar',
    length: 10,
    comment: 'Código del la provincia en la que está ubicado el establecimiento',
  })
  provinciaCodigo: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'PRV_DESCRIPCION',
    type: 'varchar',
    length: 100,
    comment: 'Descripción de la provincia en la que está ubicado el establecimiento',
  })
  provinciaDescripcion: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'CAN_CODIGO',
    comment: 'Código de la canton en la que está ubicado el establecimiento',
  })
  cantonCodigo: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'CAN_DESCRIPCION',
    comment: 'Descripción de la canton en la que está ubicado el establecimiento',
  })
  cantonDescripcion: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'PAR_CODIGO',
    type: 'varchar',
    length: 12,
    comment: 'Código de la parroquia en la que está ubicado el establecimiento',
  })
  parroquiaCodigo: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'PAR_DESCRIPCION',
    type: 'varchar',
    length: 100,
    comment: 'Descripción de la parroquia en la que está ubicado el establecimiento',
  })
  parroquiaDescripcion: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'ZON_CODIGO',
    type: 'varchar',
    length: 10,
    comment: 'Código de la zona en la que está ubicado el establecimiento',
  })
  zonaCodigo: string;

  /**
   *  Unique code of the establishment
   */
  @Column({
    name: 'ZON_DESCRIPCION',
    type: 'varchar',
    length: 100,
    comment: 'Descripción de la zona en la que está ubicado el establecimiento',
  })
  zonaDescripcion: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'DIS_CODIGO',
    type: 'varchar',
    length: 10,
    comment: 'Código del distrito en la que está ubicado el establecimiento',
  })
  distritoCodigo: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'DIS_DESCRIPCION',
    type: 'varchar',
    length: 100,
    comment: 'Descripción del distrito en la que está ubicado el establecimiento',
  })
  distritoDescripcion: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'CIR_CODIGO',
    type: 'varchar',
    length: 10,
    comment: 'Código de la circunscripción en la que está ubicado el establecimiento',
  })
  circuitoCodigo: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'TIPO_ENTIDAD',
    comment: 'Tipo de entidad del establecimiento',
    type: 'varchar',
    length: 50,
  })
  tipoEntidad: string;

  /**
   *
  Unique code of the establishment
    */
  @Column({ name: 'LONGPS', comment: 'Longitud del establecimiento', type: 'float' })
  longitudGps: number;

  /**
   *
  Unique code of the establishment
    */
  @Column({ name: 'LATGPS', comment: 'Latitud del establecimiento', type: 'float' })
  latitudGps: number;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'MAIL',
    comment: 'Correo electrónico del establecimiento',
    type: 'varchar',
    length: 100,
  })
  mail: string;
}
