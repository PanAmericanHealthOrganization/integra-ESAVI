import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
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
  schema: 'dhi_esavi',
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
}
