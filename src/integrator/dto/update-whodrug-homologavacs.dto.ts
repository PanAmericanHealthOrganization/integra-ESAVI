import { PartialType } from '@nestjs/swagger';
import { CreateWhodrugHomologaVacsDto } from './create-whodrug-homologavacs.dto';

export class UpdateWhodrugHomologavacsDto extends PartialType(CreateWhodrugHomologaVacsDto) {
    
}
