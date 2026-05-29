import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IDataQualityDimensions } from '../controllers/dto/quality.dto';

@Entity({
  schema: 'dhi_esavi',
  name: 'DQ_DIMENSION',
  comment: 'Tabla de dimensiones de calidad de los datos',
})
export class DataQualityDimensions extends Auditoria implements IDataQualityDimensions {
  /**
   * Identificador único de la dimensión de calidad
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único de la dimensión de calidad',
  })
  id: number;

  /**
   * Column  of data quality dimensions
   */
  @Column({
    name: 'anio',
    type: 'int',
    nullable: false,
    comment: 'Año de evaluación',
  })
  anio: number;

  /**
   * Column  of data quality dimensions
   */
  @Column({
    name: 'mes',
    type: 'int',
    nullable: false,
    comment: 'Mes de evaluación',
  })
  mes: number;

  @Column({
    name: 'json_quali',
    type: 'jsonb',
    nullable: false,
    comment: 'Resultado de la evaluación',
  })
  jsonQuality: string;
}
