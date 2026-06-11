import { OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TC_SYMPTOM_TO_LLT',
  comment: 'Tabla de mapeo entre síntomas en el origen DHIS2 y términos de bajo nivel (LLT) de MedDRA. Este catálogo fue elaborado manualmente por los epidemiólogos.',
})
export class CtSymptom2llt extends Auditoria implements ICtSymptom2llt{
    /**
     * Descripción de la tabla 'TC_SYMPTOM_TO_LLT' que almacena el mapeo entre síntomas en el origen DHIS2 y términos de bajo nivel (LLT) de MedDRA:
     * - ID: Identificador único de la tabla.
     * - ITEM: Enumeración del síntoma en el sistema DHIS2.
     * - SYMPTOM: Nombre del síntoma en el origen DHIS2. 
     * - LLT_NAME: Nombre del término de bajo nivel (LLT) de MedDRA asociado al síntoma.
     * - LLT_CODE: Código del término de bajo nivel (LLT) de MedDRA asociado al síntoma.
     * - OBSERVATION: Campo para observaciones adicionales sobre el mapeo.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único pk de la tabla TC_SYMPTOM_TO_LLT' })
    id: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ITEM',
        comment: 'Enumeración del síntoma en el sistema DHIS2',
    })
    item: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'SYMPTOM',
        comment: 'Nombre del síntoma en el origen DHIS2',
    })
    symptom: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'LLT_NAME',
        comment: 'Nombre del término de bajo nivel (LLT) de MedDRA asociado al síntoma',
    })
    lltName: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'LLT_CODE',
        comment: 'Código del término de bajo nivel (LLT) de MedDRA asociado al síntoma',
    })
    lltCode: string;
    /**
     * 
     */
    @Column({
        type: 'text',
        nullable: true,
        name: 'OBSERVATION',
        comment: 'Campo para observaciones adicionales sobre el mapeo',
    })
    observation: string;
}
export interface ICtSymptom2llt extends Auditoria {
    id: string;
    item: string;
    symptom: string;
    lltName: string;
    lltCode: string;
    observation: string;
}
export class CtSymptom2lltDto extends Auditoria implements ICtSymptom2llt {
    id: string;
    item: string;
    symptom: string;
    lltName: string;
    lltCode: string;
    observation: string;
}
export class CreateCtSymptom2lltDto extends OmitType(CtSymptom2lltDto, [
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
export class UpdateCtSymptom2lltDto extends OmitType(CtSymptom2lltDto, [
    'createdAt',
    'createdBy',
    'deletedAt',
    'deletedBy',
    'isActive',
    'isEnabled',
    'updatedAt',
    'updatedBy',
] as const) {}

