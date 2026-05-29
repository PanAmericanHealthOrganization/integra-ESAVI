import { IsString, IsOptional } from 'class-validator';

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
/**
 * id: string;
  patenteWhodrugVigiflow: string;
  drugNameWhodrug: string;
  mpIdWhodrug: string;
 */
