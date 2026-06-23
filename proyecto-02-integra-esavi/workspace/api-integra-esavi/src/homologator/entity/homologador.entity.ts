import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TipoDato } from '../enum/tipo-dato.enum';
import { ReglaHomologacion } from './regla-homologacion.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_HOMOLOGADOR',
  comment: 'Definición de campos homologables entre sistemas externos e integra-ESAVI',
})
@Unique(['entity', 'field'])
export class Homologador extends Auditoria {
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
    enum: TipoDato,
    default: TipoDato.STRING,
    nullable: false,
    comment: 'Tipo de dato al que se casteará el valor destino en runtime',
  })
  targetType: TipoDato;

  @OneToMany(() => ReglaHomologacion, (r) => r.homologador)
  reglasHomologacion: ReglaHomologacion[];
}
