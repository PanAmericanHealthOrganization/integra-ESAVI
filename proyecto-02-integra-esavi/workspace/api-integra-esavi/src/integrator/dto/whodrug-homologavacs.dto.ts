import {PartialType} from "@nestjs/swagger";
import {IsString} from 'class-validator';

export class CreateWhodrugHomologaVacsDto {
  @IsString()
  id: string;

  @IsString()
  patenteWhodrugVigiflow: string;

  @IsString()
  drugNameWhodrug: string;

  @IsString()
  mpIdWhodrug: string;
}

export class UpdateWhodrugHomologavacsDto extends PartialType(CreateWhodrugHomologaVacsDto) {}
