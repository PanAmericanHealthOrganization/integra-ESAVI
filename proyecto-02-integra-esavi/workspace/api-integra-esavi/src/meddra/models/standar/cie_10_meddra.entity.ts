import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *
 */
@Entity({ name: 'CIE10_TO_MEDDRA', schema: 'meddra' })
export class CIE10ES extends Auditoria {
  /**
   *
   */
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  /**
   *
   */
  @Column({ name: 'ICD_10_CHAPTER_NUMBER' })
  icd10ChapterNumber: string;

  /**
   *
   */
  @Column({ name: 'ICD_10_CHAPTER' })
  icd10Chapter: string;

  /**
   *
   */
  @Column({ name: 'ICD_10_CODE' })
  icd10Code: string;

  /**
   *
   */
  @Column({ name: 'ICD_10_TERM' })
  icd10Term: string;

  /**
   *
   */
  @Column({ name: 'MAPPED_MEDDRA_LLT' })
  mappedMeddraLlt: string;

  /**
   *
   */
  @Column({ name: 'MAPPED_MEDDRA_LLT_CODE' })
  mappedMeddraLltCode: string;

  /**
   *
   */
  @Column({ name: 'MAP_ATTRIBUTE' })
  mapAttribute: string;

  /**
   *
   */
  @Column({ name: 'MEDDRA_PT' })
  meddraPt: string;
}
