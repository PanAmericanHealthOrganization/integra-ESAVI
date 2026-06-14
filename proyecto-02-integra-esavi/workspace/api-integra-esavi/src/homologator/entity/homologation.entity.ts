import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { ComparisonType } from '../enum/comparison-type.enum';
import { Homologator } from './homologator.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TR_HOMOLOGATION',
  comment: 'Regla de transformación asociada a un homologador',
})
export class Homologation extends Auditoria {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador de la regla',
  })
  id: string;

  @Column({
    name: 'HOMOLOGATOR_ID',
    type: 'uuid',
    nullable: false,
    comment: 'FK hacia el homologador',
  })
  homologatorId: string;

  @ManyToOne(() => Homologator, (h) => h.homologations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'HOMOLOGATOR_ID' })
  homologator: Homologator;

  @Column({
    name: 'SOURCE_SYSTEM',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Sistema origen (ej. DHIS2, VIGIFLOW)',
  })
  sourceSystem: string;

  @Column({
    name: 'SOURCE_FIELD',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nombre del campo en el sistema origen',
  })
  sourceField: string;

  @Column({
    name: 'SOURCE_VALUE',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Valor de origen a comparar',
  })
  sourceValue: string;

  @Column({
    name: 'TARGET_VALUE',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Valor destino (siempre almacenado como string)',
  })
  targetValue: string;

  @Column({
    name: 'COMPARISON_TYPE',
    type: 'enum',
    enum: ComparisonType,
    default: ComparisonType.EQUALS,
    nullable: false,
    comment: 'Tipo de comparación para evaluar la regla',
  })
  comparisonType: ComparisonType;

  @Column({
    name: 'CASE_SENSITIVE',
    type: 'boolean',
    default: false,
    nullable: false,
    comment: 'Si la comparación distingue mayúsculas y minúsculas',
  })
  caseSensitive: boolean;

  @Column({
    name: 'PRIORITY',
    type: 'integer',
    default: 0,
    nullable: false,
    comment: 'Orden de evaluación (menor número = mayor prioridad)',
  })
  priority: number;
}
