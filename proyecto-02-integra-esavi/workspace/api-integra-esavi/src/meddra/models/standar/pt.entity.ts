import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SOC } from './soc.entity';

/**
 *
 */
@Entity({ name: 'MED_PT', schema: 'MEDDRA' })
export class PT extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn({ name: 'ID', comment: 'Identificador de la tabla' })
  id: number;

  /**
   *
   */
  @Column({ name: 'CODE', nullable: true, comment: 'Código de la PT' })
  code: string;
  /**
   *
   */
  @Column({ name: 'NAME', nullable: true, comment: 'Nombre de la PT' })
  name: string;
  /**
   *
   */
  @Column({ name: 'FIELD', nullable: true, comment: 'Campo' })
  field: string;
  /**
   *
   */
  @Column({ name: 'SOC_CODE', nullable: true, comment: 'Código del SOC' })
  socCode: string;

  /**
   *
   */
  @ManyToOne(() => SOC)
  @JoinColumn({ name: 'ID_SOC_CODE', referencedColumnName: 'id' })
  soc: SOC;

  /**
   *
   */
  @Column({ name: 'WHOART_CODE', nullable: true, comment: 'Código de la PT en la tabla WHOART' })
  whoArtCode: string;

  /**
   *
   */
  @Column({ name: 'HARTS_CODE', nullable: true, comment: 'Código de la PT en la tabla HARTS' })
  hartsCode: string;
  /**
   *
   */
  @Column({ name: 'COSTART_SYM', nullable: true, comment: 'Símbolo de la PT en la tabla COSTART' })
  costartSym: string;
  /**
   *
   */
  @Column({ name: 'ICD9_CODE', nullable: true, comment: 'Código de la PT en la tabla ICD9' })
  icd9Code: string;
  /**
   *
   */
  @Column({ name: 'ICD9CM_CODE', nullable: true, comment: 'Código de la PT en la tabla ICD9CM' })
  icd9cmCode: string;
  /**
   *
   */
  @Column({ name: 'ICD10_CODE', nullable: true, comment: 'Código de la PT en la tabla ICD10' })
  icd10Code: string;
  /**
   *
   */
  @Column({ name: 'JART_CODE', nullable: true, comment: 'Código de la PT en la tabla JART' })
  jartCod: string;
}
