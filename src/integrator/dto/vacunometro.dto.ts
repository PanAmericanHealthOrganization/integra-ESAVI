import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Auditoria, IVacunometro } from '../entity';

export class VacunometroDto extends Auditoria implements IVacunometro {
  /**
   * Identificador único del vacunómetro
   *
   */
  @ApiProperty()
  id: string;
  /**
   * Identificador único del vacunómetro
   *
   */
  @ApiProperty()
  unicodigo: string;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  nombreVacuna: string;

  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  fechaAplicacion: Date;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  totalHombres: number;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  totalMujeres: number;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  total: number;
}

/**
 *
 */
export class VacunometroCreateDto extends OmitType(VacunometroDto, ['id'] as const) {}
export class VacunometroUpdateDto extends OmitType(VacunometroDto, ['id'] as const) {}
