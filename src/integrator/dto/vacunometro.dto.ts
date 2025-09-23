import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IVacunometro } from '../entity';

export class VacunometroDto implements IVacunometro {
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
  unicode: string;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  nombreVacuna: string;
  /**
   * Api property of vacunometro dto
   */
  @ApiProperty()
  dosisAplicada: string;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  diaAplicacion: number;
  /**
   * Identificador único del vacunómetro
   *
   */
  @ApiProperty()
  mesAplicacion: number;
  /**
   * Identificador único del vacunómetro
   *
   */
  @ApiProperty()
  anioAplicacion: number;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  fechaAplicacion: Date;
  /**
   *  Identificador único del vacunómetro
   */
  @ApiProperty()
  sexo: string;
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
