import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';
/**
 *
 */
@Entity({ name: 'MAPPINGS' })
export class Mappings extends Auditoria {
  /**
   *
   */
  @PrimaryColumn({ name: 'ID', comment: 'Identificador único de la tabla' })
  id: string;

  /**
   *
   */
  @Column({ name: 'MAP_SOURCE_VALUE', comment: '' })
  sourceValue: string;
  /**
   *
   */
  @Column({ name: 'MAP_TARGET_VALUE', comment: '' })
  targetValue: string;
  /**
   *
   */
  @Column({ name: 'MAP_CONDITION', comment: '' })
  condition: string;
  /**
   *
   */
  @Column({ name: 'MAO_DESCRIPTION', comment: '' })
  description: string;
}
