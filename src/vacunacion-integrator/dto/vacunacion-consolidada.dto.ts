import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * DTO para respuesta de datos consolidados de vacunación
 */
export class VacunacionConsolidadaDto {
  /**
   * Fecha de aplicación de la vacuna
   */
  @ApiProperty({
    description: 'Fecha de aplicación de la vacuna',
    example: '2023-06-15T00:00:00.000Z',
    type: Date,
  })
  fecha_aplicacion: Date;

  /**
   * Código único del registro
   */
  @ApiProperty({
    description: 'Código único del registro',
    example: 'UC123456789',
    type: String,
  })
  unicodigo: string;

  /**
   * Sexo de la persona vacunada
   */
  @ApiProperty({
    description: 'Sexo de la persona vacunada',
    example: 'M',
    enum: ['M', 'F'],
  })
  sexo: string;

  /**
   * Nombre de la vacuna aplicada
   */
  @ApiProperty({
    description: 'Nombre de la vacuna aplicada',
    example: 'PFIZER',
    type: String,
  })
  nombre_vacuna: string;

  /**
   * Total de registros agrupados
   */
  @ApiProperty({
    description: 'Total de registros agrupados',
    example: 150,
    type: Number,
  })
  total: number;
}

/**
 * DTO para filtros de consulta por fecha
 */
export class FiltroFechaDto {
  /**
   * Fecha de inicio del filtro
   */
  @ApiProperty({
    description: 'Fecha de inicio del filtro (formato: YYYY-MM-DD)',
    example: '2023-01-01',
    type: String,
  })
  fechaInicio: string;

  /**
   * Fecha de fin del filtro
   */
  @ApiProperty({
    description: 'Fecha de fin del filtro (formato: YYYY-MM-DD)',
    example: '2023-12-31',
    type: String,
  })
  fechaFin: string;
}

/**
 * DTO para filtro por vacuna
 */
export class FiltroVacunaDto {
  /**
   * Nombre de la vacuna
   */
  @ApiProperty({
    description: 'Nombre de la vacuna',
    example: 'PFIZER',
    type: String,
  })
  nombreVacuna: string;
}

/**
 * DTO para filtro por sexo
 */
export class FiltroSexoDto {
  /**
   * Sexo de la persona
   */
  @ApiProperty({
    description: 'Sexo de la persona',
    example: 'M',
    enum: ['M', 'F'],
  })
  sexo: string;
}

/**
 * DTO para respuesta de total general
 */
export class TotalGeneralDto {
  /**
   * Total general de registros
   */
  @ApiProperty({
    description: 'Total general de registros',
    example: 25000,
    type: Number,
  })
  totalGeneral: number;
}

/**
 *
 */
@ValidatorConstraint({ name: 'maxDateRange', async: false })
class MaxDateRangeConstraint implements ValidatorConstraintInterface {
  validate(hasta: any, args: ValidationArguments) {
    const obj = args.object as any;
    const desde = new Date(obj.desde);
    const hastaDate = new Date(hasta);

    if (isNaN(desde.getTime()) || isNaN(hastaDate.getTime())) {
      return false;
    }

    const unAnioEnMs = 365 * 24 * 60 * 60 * 1000; // 1 año en milisegundos
    const diferencia = hastaDate.getTime() - desde.getTime();

    return diferencia >= 0 && diferencia <= unAnioEnMs;
  }

  defaultMessage(args: ValidationArguments) {
    return 'El rango de fechas debe ser máximo de 1 año y la fecha "hasta" debe ser posterior a "desde"';
  }
}

/**
 *
 */
export class SyncRangeDto {
  @ApiProperty({ example: '2023-01-01', description: 'Fecha inicial en formato YYYY-MM-DD' })
  @IsDateString()
  desde: Date;

  @ApiProperty({
    example: '2023-12-31',
    description: 'Fecha final en formato YYYY-MM-DD (máximo 1 año desde la fecha inicial)',
  })
  @IsDateString()
  @Validate(MaxDateRangeConstraint)
  hasta: Date;
}
