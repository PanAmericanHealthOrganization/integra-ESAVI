import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({
  schema: 'dhi_esavi',
  name: 'DQ_DIMENSION',
  comment: 'Tabla de dimensiones de calidad de los datos',
})
export class DataQualityDimensions {
  /**
   * Identificador único de la dimensión de calidad
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único de la dimensión de calidad',
  })
  id: number;

  /**
   *
   */
  @CreateDateColumn({
    name: 'fecha',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Fecha de evaluación ',
  })
  fecha: Date;

  /**
   *
   */
  @Column({
    name: 'dimension',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Grupo de evaluación',
  })
  dimension: string;

  @Column({
    name: 'json_quali',
    type: 'jsonb',
    nullable: false,
    comment: 'Resultado de la evaluación',
  })
  jsonQuality: string;
}
