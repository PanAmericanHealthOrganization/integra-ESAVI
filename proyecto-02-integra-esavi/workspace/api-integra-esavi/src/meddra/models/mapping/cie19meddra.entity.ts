import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *
 */
//comment: 'Tabla de homologación CIE10-MEDDRA'
@Entity({ name: 'MED_CIE10_TO_MED' })
export class cie10Meddra extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn({ name: 'ID', comment: 'Identificador único de la tabla' })
  id: string;

  /**
   *
   */
  @Column({ name: 'ICD10_CHARPER_NUMBER', comment: 'Número de capitulo de la CIE10' })
  icd10_charper_number: string;

  /**
   *
   */
  @Column({ name: 'ICD10_CHARPER', comment: 'Capitulo de la CIE10' })
  icd10_charper: string;

  /**
   *
   */
  @Column({ name: 'ICD10_CODE', comment: 'Código de la CIE10' })
  icd10_code: string;

  /**
   *
   */
  @Column({ name: 'ICD10_TERM', comment: 'Término de la CIE10' })
  icd10_term: string;

  /**
   *
   */
  @Column({ name: 'MEDDRA_LLT_NAME', comment: 'Nombre de la LLT' })
  meddra_llt_name: string;

  /**
   *
   */
  @Column({ name: 'MEDDRA_LLT_CODE', comment: 'Código de la LLT' })
  meddra_llt_code: string;

  /**
   *
   */
  @Column({ name: 'EQUIVALENCE', comment: 'Equivalencia de la CIE10-MEDDRA' })
  equivalence: string;

  /**
   *
   */
  @Column({ name: 'MEDDRA_PT_NAME', comment: 'Nombre de la PT' })
  meddra_pt_name: string;

  /**
   *
   */
  @Column({ name: 'MEDDRA_PT_CODE', comment: 'Código de la PT' })
  meddra_pt_code: string;
}
