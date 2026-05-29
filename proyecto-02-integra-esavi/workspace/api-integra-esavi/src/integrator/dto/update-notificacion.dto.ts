import { PartialType } from '@nestjs/swagger';
import { SourceEnum } from '../enum/source-enum';
import { ApiProperty } from '@nestjs/swagger';
import { CreateNotificacionDto } from './create-notificacion.dto';

export class UpdateNotificacionDto extends PartialType(CreateNotificacionDto) {
  @ApiProperty({
    enum: SourceEnum,
    enumName: 'SourceEnum',
    default: SourceEnum.DHIS2,
  })
  source: SourceEnum;
  id: string;
  constructor() {
    super();
  }
}
