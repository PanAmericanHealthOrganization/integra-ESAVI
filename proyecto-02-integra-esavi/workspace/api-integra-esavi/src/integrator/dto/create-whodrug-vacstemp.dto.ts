import { IsString, IsOptional } from 'class-validator';

export class CreateWhodrugVacsTempDto {
    @IsString()    
    id: string;

    @IsOptional()
    @IsString()
    item?: string;

    @IsString()
    drugCode: string;

    @IsString()
    drugName: string;

    @IsString()
    medicinalProductId: string;

    @IsString()
    atcCode: string;

    @IsString()
    abbreviation: string;

    @IsString()
    activeIngredient: string;

    @IsString()
    actiIngredientTranslation: string;

    @IsString()
    languageCode: string;

    @IsString()
    countryIso3Code: string;

    @IsString()
    countryMediProdId: string;

    @IsString()
    maHolder: string;

    @IsString()
    maHolderMediProdId: string;

    @IsString()
    pharmaceuticalForm: string;

    @IsString()
    pharFormTranslation: string;

    @IsString()
    pharFormMediProdId: string;

    @IsString()
    strength: string;

    @IsString()
    strengthMediProdId: string;

    @IsString()
    isGeneric: string;

    @IsString()
    isPreferred: string;
    
}
/**
 * id: string;
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
 */
