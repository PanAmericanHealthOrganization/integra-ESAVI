import { Auditoria } from 'src/integrator/entity/auditoria.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TipoComparacion } from '../enum/tipo-comparacion.enum';
import { Homologador } from './homologador.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TR_HOMOLOGACION_REGLA',
  comment: 'Regla de transformación asociada a un homologador',
})
export class ReglaHomologacion extends Auditoria {
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
  homologadorId: string;

  @ManyToOne(() => Homologador, (h) => h.reglasHomologacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'HOMOLOGATOR_ID' })
  homologador: Homologador;

  @Column({
    name: 'SOURCE_SYSTEM',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Sistema de origen (ej. VIGIFLOW, DHIS2)',
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
    enum: TipoComparacion,
    default: TipoComparacion.EQUALS,
    nullable: false,
    comment: 'Tipo de comparación para evaluar la regla',
  })
  comparisonType: TipoComparacion;

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
