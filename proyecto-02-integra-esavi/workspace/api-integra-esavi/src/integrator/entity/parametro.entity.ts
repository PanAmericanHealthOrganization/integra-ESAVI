import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TipoDato } from '../../homologator/enum/tipo-dato.enum';
import { Auditoria } from './auditoria.entity';

export enum IntegrationGroup {
  DHIS2 = 'DHIS2',
  VIGIFLOW = 'VIGIFLOW',
  HL7FIRE = 'HL7FIRE',
}

/**
 *
 */
@Entity({
  schema: 'DHI_ESAVI',
  name: 'TC_PARAMETRO',
  comment: 'Tabla de parámetros de configuración',
})
export class Parametro extends Auditoria {
  /**
   * Primary generated column of parametro
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único PK de la tabla TC_PARAMETRO' })
  id: string;

  /**
   * Column  of parametro
   */
  @Column({
    name: 'CLAVE',
    nullable: false,
    unique: true,
    length: 32,
    comment: 'Clave única del parámetro de configuración',
  })
  clave: string;

  /**
   * Column  of parametro
   */
  @Column({
    name: 'VALOR',
    type: 'text',
    nullable: true,
    comment: 'Valor asociado al parámetro de configuración',
  })
  valor: string;

  /**
   * Column  of parametro
   */
  @Column({
    name: 'DESCRIPCION',
    nullable: true,
    length: 512,
    comment: 'Descripción detallada del parámetro',
  })
  descripcion: string;

  /**
   * Column  of parametro
   */
  @Column({
    name: 'MODULO',
    nullable: true,
    length: 64,
    comment: 'Módulo al que pertenece el parámetro de configuración',
  })
  modulo: string;

  /**
   * Column  of parametro
   */
  @Column({
    name: 'TIPO_DATO',
    type: 'enum',
    enum: TipoDato,
    default: TipoDato.STRING,
    nullable: false,
    comment: 'Tipo de dato del valor del parámetro de configuración',
  })
  tipo_dato: TipoDato;

  /**
   * Column  of parametro
   */
  @Column({
    name: 'ES_ENCRIPTADO',
    type: 'boolean',
    default: false,
    nullable: false,
    comment: 'Indica si el valor del parámetro se encuentra encriptado',
  })
  es_encriptado: boolean;
}
