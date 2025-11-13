import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({
  schema: 'dataquality',
  name: 'quality_dimension',
  comment: 'Tabla de dimensiones de calidad de los datos',
})
export class DataqualityDimensions {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'fecha', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ name: 'dimension', type: 'varchar', length: 255, nullable: false })
  dimension: string;

  @Column({ name: 'json_quali', type: 'jsonb', nullable: false })
  jsonQuality: string;
}
