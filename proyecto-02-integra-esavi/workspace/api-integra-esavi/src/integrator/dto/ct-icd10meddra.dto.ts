import {PartialType} from "@nestjs/swagger";
import {IsOptional,IsString} from 'class-validator';

export class CreateCtIcd10meddraDto {
  @IsString()
  icd10ChapterNumber: string;

  @IsString()
  icd10ChapterTitle: string;

  @IsString()
  icd10Code: string;

  @IsString()
  icd10Term: string;

  @IsString()
  @IsOptional()
  meddraLlt: string;

  @IsString()
  @IsOptional()
  meddraLltCode: string;

  @IsString()
  @IsOptional()
  mapAttribute: string;

  @IsString()
  @IsOptional()
  meddraPt: string;

  @IsString()
  @IsOptional()
  meddraPtCode: string;
}

export class UpdateCtIcd10meddraDto extends PartialType(CreateCtIcd10meddraDto) {}
