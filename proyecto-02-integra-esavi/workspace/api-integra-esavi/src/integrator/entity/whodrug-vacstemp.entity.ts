import { OmitType } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

/**
 *
 */
@Entity({
  schema: 'dhi_esavi',
  name: 'TC_WHODRUG_VACS_TEMP',
  comment: 'Tabla de mapeo WHODrug para los datos del origen VigiFLow. Este catálogo se utilizará de forma provisional hasta que concluya el proceso de actualización del catálogo oficial de la Uppsala Monitorig Centre. Este catálogo fue elaborado manualmente por los epidemiólogos.',
})

export class WhodrugVacsTemp extends Auditoria implements IWhodrugVacsTemp{

    /**
     * Descripción de la tabla 'TC_WHODRUG_VACS_TEMP' que almacena el mapeo WHODrug para los datos del origen VigiFLow:
     * - ID: Identificador único de la tabla.
     * - ITEM: Número secuencial del registro.
     * - DRUG_CODE: Código WHODrug de la vacuna.
     * - DRUG_NAME: Nombre WHODrug de la vacuna.
     * - MEDICINAL_PRODUCT_ID: Identificador del producto medicinal asociado a la vacuna.
     * - ATC_CODE: Código Anatomical Therapeutic Chemical, asociado a la vacuna.
     * - ABBREVIATION: Abreviatura del nombre WHODrug de la vacuna.
     * - ACTIVE_INGREDIENT: Ingrediente activo de la vacuna según WHODrug.
     * - ACTI_INGREDIENT_TRANSLATION: Traducción del ingrediente activo de la vacuna.
     * - LANGUAGE_CODE: Código del idioma utilizado en la traducción.
     * - COUNTRY_ISO3CODE: Código ISO3 del país asociado a la traducción.
     * - COUNTRY_MEDI_PROD_ID: Identificador del producto medicinal asociado al país.
     * - MA_HOLDER: Titular del medicamento. MAH (Marketing Authorization Holder / Titular de la autorización de comercialización). Titular de registro sanitario.
     * - MA_HOLDER_MEDI_PROD_ID: Identificador del producto medicinal, asociado titular del medicamento.
     * - PHARMACEUTICAL_FORM: Forma farmacéutica de la vacuna.
     * - PHAR_FORM_TRANSLATION: Traducción de la forma farmacéutica de la vacuna.
     * - PHAR_FORM_MEDI_PROD_ID: Identificador del producto medicinal, asociado a la forma farmacéutica. 
     * - STRENGTH: Concentración de la vacuna. "Potencia", fuerza, concentración.
     * - STRENGTH_MEDI_PROD_ID: Identificador del producto medicinal, asociado a la potencia o concentración.
     * - IS_GENERIC: Indica si es un medicamento genérico.
     * - IS_PREFERRED: Indica si es el medicamento preferido.
     */

    @PrimaryGeneratedColumn('uuid', { name: 'ID', comment: 'Identificador único pk de la tabla TC_WHODRUG_VACS_TEMP' })
    id: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ITEM',
        comment: 'Número secuencial del registro',
    })
    item: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'DRUG_CODE',
        comment: 'Código WHODrug de la vacuna',
    })
    drugCode: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'DRUG_NAME',
        comment: 'Nombre WHODrug de la vacuna',
    })
    drugName: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MEDICINAL_PRODUCT_ID',
        comment: 'Identificador del producto medicinal asociado a la vacuna',
    })
    medicinalProductId: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ATC_CODE',
        comment: 'Código Anatomical Therapeutic Chemical, asociado a la vacuna',
    })
    atcCode: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ABBREVIATION',
        comment: 'Abreviatura del nombre WHODrug de la vacuna',
    })
    abbreviation: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ACTIVE_INGREDIENT',
        comment: 'Ingrediente activo de la vacuna según WHODrug',
    })
    activeIngredient: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'ACTI_INGREDIENT_TRANSLATION',
        comment: 'Traducción del ingrediente activo de la vacuna',
    })
    actiIngredientTranslation: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'LANGUAGE_CODE',
        comment: 'Código del idioma utilizado en la traducción',
    })
    languageCode: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'COUNTRY_ISO3CODE',
        comment: 'Código ISO3 del país asociado a la traducción',
    })
    countryIso3Code: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'COUNTRY_MEDI_PROD_ID',
        comment: 'Identificador del producto medicinal asociado al país',
    })
    countryMediProdId: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MA_HOLDER',
        comment: 'Titular del medicamento. MAH (Marketing Authorization Holder / Titular de la autorización de comercialización). Titular de registro sanitario',
    })
    maHolder: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'MA_HOLDER_MEDI_PROD_ID',
        comment: 'Identificador del producto medicinal, asociado titular del medicamento',
    })
    maHolderMediProdId: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'PHARMACEUTICAL_FORM',
        comment: 'Forma farmacéutica de la vacuna',
    })
    pharmaceuticalForm: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'PHAR_FORM_TRANSLATION',
        comment: 'Traducción de la forma farmacéutica de la vacuna',
    })
    pharFormTranslation: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'PHAR_FORM_MEDI_PROD_ID',
        comment: 'Identificador de el producto medicinal, asociado a la forma farmacéutica',
    })
    pharFormMediProdId: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'STRENGTH',
        comment: 'Concentración de la vacuna. "Potencia", fuerza, concentración',
    })
    strength: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'STRENGTH_MEDI_PROD_ID',
        comment: 'Identificador del producto medicinal, asociado a la potencia o concentración',
    })
    strengthMediProdId: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'IS_GENERIC',
        comment: 'Indica si es un medicamento genérico',
    })
    isGeneric: string;
    /**
     * 
     */
    @Column({
        type: 'varchar',
        nullable: true,
        name: 'IS_PREFERRED',
        comment: 'Indica si es el medicamento preferido',
    })
    isPreferred: string;
}
export interface IWhodrugVacsTemp extends Auditoria {
    id: string;
    item: string;
    drugCode: string;
    drugName: string;
    medicinalProductId: string;
    atcCode: string;
    abbreviation: string;
    activeIngredient: string;
    actiIngredientTranslation: string;
    languageCode: string;
    countryIso3Code: string;
    countryMediProdId: string;
    maHolder: string;
    maHolderMediProdId: string;
    pharmaceuticalForm: string;
    pharFormTranslation: string;
    pharFormMediProdId: string;
    strength: string;
    strengthMediProdId: string;
    isGeneric: string;
    isPreferred: string;
}
export class WhodrugVacsTempDto extends Auditoria implements IWhodrugVacsTemp {
    id: string;
    item: string;
    drugCode: string;
    drugName: string;
    medicinalProductId: string;
    atcCode: string;
    abbreviation: string;
    activeIngredient: string;
    actiIngredientTranslation: string;
    languageCode: string;
    countryIso3Code: string;
    countryMediProdId: string;
    maHolder: string;
    maHolderMediProdId: string;
    pharmaceuticalForm: string;
    pharFormTranslation: string;
    pharFormMediProdId: string;
    strength: string;
    strengthMediProdId: string;
    isGeneric: string;
    isPreferred: string;
}
export class CreateWhodrugVacsTempDto extends OmitType(WhodrugVacsTempDto, [
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
export class UpdateWhodrugVacsTempDto extends OmitType(WhodrugVacsTempDto, [
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
