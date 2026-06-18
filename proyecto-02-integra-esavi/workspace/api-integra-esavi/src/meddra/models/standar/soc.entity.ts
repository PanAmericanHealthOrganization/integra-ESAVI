import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MeddraSync } from './meddraSync.entity';

@Entity({ name: 'MED_SOC', schema: 'MEDDRA' })
export class SOC extends Auditoria {
  // PK
  @PrimaryGeneratedColumn({
    name: 'ID',
    comment: 'Identificador único del registro en base de datos ',
  })
  id: number;

  /**
   *
   */
  @Column({
    name: 'CODE',
    comment: 'Código único del soc perteneciente al estandar meddra',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  code: string;

  /**
   *
   */
  @Column({
    name: 'NAME',
    comment: 'Nombre del soc',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  name: string;

  /**
   *
   */
  @Column({
    name: 'ABBREV',
    comment: 'Abreviatura',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  abbrev: string;

  /**
   *
   */
  @Column({
    name: 'WHOART_CODE',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  whoartCode: string;

  /**
   *
   */
  @Column({
    name: 'HARTS_CODE',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  hartsCode: string;
  /**

  *
   */
  @Column({
    name: 'COSTART_SYM',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  costartSym: string;
  /**

  *
   */
  @Column({
    name: 'ICD9_CODE',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  icd9Code: string;
  /**

  *
   */
  @Column({
    name: 'ICD9CM_CODE',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  icd9cm_code: string;
  /**

  *
   */
  @Column({
    name: 'ICD10_CODE',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  icd10_code: string;
  /**
   *
   */
  @Column({
    name: 'JART_CODE',
    comment: '',
    length: 1024,
    type: 'varchar',
    nullable: true,
  })
  jart_code: string;

  /**
   *
   */
  @ManyToOne(() => MeddraSync)
  @JoinColumn({ name: 'SYNC_ID', referencedColumnName: 'id' })
  meddraSync: MeddraSync;
}
