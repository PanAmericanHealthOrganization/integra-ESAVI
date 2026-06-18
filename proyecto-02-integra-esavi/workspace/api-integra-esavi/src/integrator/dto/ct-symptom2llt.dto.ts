import {PartialType} from "@nestjs/swagger";
import {IsOptional,IsString} from 'class-validator';

export class CreateCtSymptom2lltDto {
  @IsString()
  item: string;

  @IsString()
  symptom: string;

  @IsString()
  @IsOptional()
  lltName?: string;

  @IsString()
  @IsOptional()
  lltCode?: string;

  @IsString()
  @IsOptional()
  observation?: string;
}

export class UpdateCtSymptom2lltDto extends PartialType(CreateCtSymptom2lltDto) {}
