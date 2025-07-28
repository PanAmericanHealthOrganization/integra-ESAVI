import { AfterInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IPoblacionVacunada } from './dto/poblacion-vacunada.dto';

@Entity({ name: 'problacion_vacunada', schema: 'vacunas_agregado' })
export class PoblacionVacunada implements IPoblacionVacunada {
  /**
   *
   */
  @PrimaryGeneratedColumn({ name: 'id', comment: 'Identificador único' })
  id: number;

  /**
   *
   */
  @Column({
    type: 'varchar',
    length: 10,
    comment: 'Código del establecimiento de salud',
  })
  uniCodigo: string;

  /**
   *
   */
  @Column({ type: 'date', comment: 'Fecha de vacunación' })
  fechaVacunacion: Date;

  /**
   *
   */
  @Column({ type: 'date', comment: 'Fecha de vacunación' })
  fecha_vacunacion: string;

  /**
   *
   */
  @Column({ type: 'varchar', length: 1, comment: 'Sexo del paciente' })
  sexo: string;

  /**
   *
   */
  @Column({ type: 'int', comment: 'Edad de los  pacientes' })
  edad: number;

  /**
   *
   */
  @Column({ type: 'varchar', length: 100, comment: 'Nombre de la vacuna' })
  vacuna: string;

  /**
   *
   */
  @Column({ type: 'varchar', length: 100, comment: 'Lote de la vacuna' })
  lote: string;

  /**
   *
   */
  @Column({ type: 'int', comment: 'Total de vacunados' })
  totalVacunados: number;

  /**
   *
   */
  @Column({ type: 'timestamp', comment: 'Fecha de sincronización' })
  fechaSincronizacion: Date;

  /**
   *
   */
  @AfterInsert()
  async afterInsert() {
    this.fechaSincronizacion = new Date();
  }
}
