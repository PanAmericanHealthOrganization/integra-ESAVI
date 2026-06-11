import { PartialType } from '@nestjs/swagger';
import { CreateWhodrugVacsTempDto } from './create-whodrug-vacstemp.dto';

export class UpdateWhodrugVacsTempDto extends PartialType(CreateWhodrugVacsTempDto) {
    
}
