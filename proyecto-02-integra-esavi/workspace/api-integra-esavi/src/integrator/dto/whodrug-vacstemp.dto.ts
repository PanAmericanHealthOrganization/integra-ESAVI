import {PartialType} from "@nestjs/swagger";
import {IsOptional,IsString} from 'class-validator';

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

export class UpdateWhodrugVacsTempDto extends PartialType(CreateWhodrugVacsTempDto) {}
