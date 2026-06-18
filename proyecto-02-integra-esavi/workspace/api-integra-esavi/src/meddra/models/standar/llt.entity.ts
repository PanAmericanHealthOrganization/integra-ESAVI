import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PT } from './pt.entity';
import { Auditoria } from 'src/integrator/entity';

/**
 *
 */
@Entity({ name: 'MED_LLT', schema: 'MEDDRA' })
export class LLT extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn({ name: 'ID', comment: 'Identificador de la tabla' })
  id: number;

  /**
   *
   */
  @Column({ name: 'CODE', nullable: true, comment: 'Código de la LLT' })
  code: string;

  /**
   *
   */
  @Column({ name: 'NAME', nullable: true, comment: 'Nombre de la LLT' })
  name: string;

  /**
   *
   */
  @Column({ name: 'PT_CODE', nullable: true, comment: 'Código de la PT' })
  ptCode: string;

  /**
   *
   */
  @Column({ name: 'WHOART_CODE', nullable: true })
  whoartCode: string;

  /**
   *
   */
  @Column({ name: 'HARTS_CODE', nullable: true })
  hartsCode: string;

  /**
   *
   */
  @Column({ name: 'HARTS_CODE2', nullable: true })
  hartsCode2: string;

  /**
   *
   */
  @Column({ name: 'COSTART_SYM', nullable: true })
  costartSym: string;

  /**
   *
   */
  @Column({ name: 'ICD9_CODE', nullable: true })
  icd9Code: string;

  /**
   *
   */
  @Column({ name: 'ICD9CM_CODE', nullable: true })
  icd9cmCode: string;

  /**
   *
   */
  @Column({ name: 'ICD10_CODE', nullable: true })
  icd10Code: string;

  /**
   *
   */
  @Column({ name: 'CURRENCY', nullable: true })
  currency: string;

  /**
   *
   */
  @Column({ name: 'JART_CODE', nullable: true })
  jartCode: string;
  /**
   *
   */
  @ManyToOne(() => PT)
  @JoinColumn({ name: 'ID_PT_CODE', referencedColumnName: 'id' })
  pt: PT;
}
