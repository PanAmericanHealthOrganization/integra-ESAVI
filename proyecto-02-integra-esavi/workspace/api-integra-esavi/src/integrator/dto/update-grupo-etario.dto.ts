import { PartialType } from '@nestjs/swagger';
import { CreateGrupoEtarioDto } from './create-grupo-etario.dto';

export class UpdateGrupoEtarioDto extends PartialType(CreateGrupoEtarioDto) {}
