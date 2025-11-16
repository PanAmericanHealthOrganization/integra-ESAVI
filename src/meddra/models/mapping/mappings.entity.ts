import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';
/**
 *
 */
@Entity({ name: 'mappings' })
export class Mappings extends Auditoria {
  /**
   *
   */
  @PrimaryColumn({ name: 'id', comment: 'Identificador único de la tabla' })
  id: string;

  /**
   *
   */
  @Column({ name: 'map_source_value', comment: '' })
  sourceValue: string;
  /**
   *
   */
  @Column({ name: 'map_target_value', comment: '' })
  targetValue: string;
  /**
   *
   */
  @Column({ name: 'map_condition', comment: '' })
  condition: string;
  /**
   *
   */
  @Column({ name: 'mao_description', comment: '' })
  description: string;
}
