import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';

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
