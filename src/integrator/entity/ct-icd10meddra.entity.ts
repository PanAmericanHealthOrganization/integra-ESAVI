import { OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TC_ICD10_MEDDRA',
  comment: 'Tabla de mapeo entre codigos ICD10 y MedDRA',
})
export class CtIcd10meddra extends Auditoria implements ICtIcd10meddra{//CtIcd10meddraEntity
    /**
     * Descripción de la tabla 'TC_ICD10_MEDDRA' que almacena el mapeo entre códigos ICD10 y MedDRA:
     * - ID: Identificador único de la tabla.
     * - ICD10_CHAPTER_NUMBER: Número del capítulo ICD10.
     * - ICD10_CHAPTER_TITLE: Título del capítulo ICD10.
     * - ICD10_CODE: Código ICD10.
     * - ICD10_TERM: Término asociado al código ICD10.
     * - MEDDRA_LLT: Término de bajo nivel MedDRA.
     * - MEDDRA_LLT_CODE: Código del término de bajo nivel MedDRA.
     * - MAP_ATTRIBUTE: Atributo de mapeo entre ICD10 y MedDRA.
     * - MEDDRA_PT: Término preferido MedDRA.
     * - MEDDRA_PT_CODE: Código del término preferido MedDRA.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único pk de la tabla TC_ICD10_MEDDRA' })
    id: string;
    /**
     * 
     */

    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ICD10_CHAPTER_NUMBER',
        comment: 'Número del capítulo ICD10',
    })
    icd10ChapterNumber: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ICD10_CHAPTER_TITLE',
        comment: 'Título del capítulo ICD10',
    })
    icd10ChapterTitle: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ICD10_CODE',
        comment: 'Código ICD10',
    })
    icd10Code: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ICD10_TERM',
        comment: 'Término asociado al código ICD10',
    })
    icd10Term: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MEDDRA_LLT',
        comment: 'Término de bajo nivel MedDRA',
    })
    meddraLlt: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MEDDRA_LLT_CODE',
        comment: 'Código del término de bajo nivel MedDRA',
    })
    meddraLltCode: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MAP_ATTRIBUTE',
        comment: 'Atributo de mapeo entre ICD10 y MedDRA',
    })
    mapAttribute: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MEDDRA_PT',
        comment: 'Término preferido MedDRA',
    })
    meddraPt: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MEDDRA_PT_CODE',
        comment: 'Código del término preferido MedDRA',
    })
    meddraPtCode: string;

}
export interface ICtIcd10meddra extends Auditoria {
    id: string;
    icd10ChapterNumber: string;
    icd10ChapterTitle: string;
    icd10Code: string;
    icd10Term: string;
    meddraLlt: string;
    meddraLltCode: string;
    mapAttribute: string;
    meddraPt: string;
    meddraPtCode: string;
}
export class CtIcd10meddraDto extends Auditoria implements ICtIcd10meddra {
    id: string;
    icd10ChapterNumber: string;
    icd10ChapterTitle: string;
    icd10Code: string;
    icd10Term: string;
    meddraLlt: string;
    meddraLltCode: string;
    mapAttribute: string;
    meddraPt: string;
    meddraPtCode: string;
}
export class CreateCtIcd10meddraDto extends OmitType(CtIcd10meddraDto, [
    'id',
    'createdAt',
    'createdBy',
    'deletedAt',
    'deletedBy',
    'isActive',
    'isEnabled',
    'updatedAt',
    'updatedBy',
] as const) {}
export class UpdateCtIcd10meddraDto extends OmitType(CtIcd10meddraDto, [
    'createdAt',
    'createdBy',
    'deletedAt',
    'deletedBy',
    'isActive',
    'isEnabled',
    'updatedAt',
    'updatedBy',
] as const) {}
