import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { DataType } from '../enum/data-type.enum';
import { Homologation } from './homologation.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_HOMOLOGATOR',
  comment: 'Definición de campos homologables entre sistemas externos e integra-ESAVI',
})
@Unique(['entity', 'field'])
export class Homologator extends Auditoria {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador del homologador',
  })
  id: string;

  @Column({
    name: 'ENTITY',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Entidad destino (ej. Persona)',
  })
  entity: string;

  @Column({
    name: 'FIELD',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Campo destino (ej. sexo)',
  })
  field: string;

  @Column({
    name: 'DESCRIPTION',
    type: 'text',
    nullable: true,
    comment: 'Descripción del propósito del homologador',
  })
  description: string;

  @Column({
    name: 'TARGET_TYPE',
    type: 'enum',
    enum: DataType,
    default: DataType.STRING,
    nullable: false,
    comment: 'Tipo de dato al que se casteará el valor destino en runtime',
  })
  targetType: DataType;

  @OneToMany(() => Homologation, (h) => h.homologator)
  homologations: Homologation[];
}
