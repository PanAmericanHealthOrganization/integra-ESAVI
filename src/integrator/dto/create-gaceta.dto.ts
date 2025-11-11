import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUrl, Min } from 'class-validator';
import { ESTADO_GACETA, IGaceta } from '../entity/interfaces/gaceta.interface';

export type GacetaEstado = 'PUBLICADO' | 'PENDIENTE' | 'CANCELADO';

// Creamos una clase base que implementa IGaceta para usar con PartialType
class GacetaBase implements IGaceta {
  id: string;
  fechaPublicacion: Date;
  numeroGaceta: number;
  volumen: number;
  desde: Date;
  hasta: Date;
  urlGaceta: string;
  estado: ESTADO_GACETA;
  autor: string;
  cargo: string;
  titulo: string;
  autorSecundario: string;
  cargoSecundario: string;
  analisisGravedad: string;
  analisisSexoEdad: string;
  analisisTipoEvento: string;
  analisisGeografico: string;
  conclusiones: string;
  recomendaciones: string;
  resumenContenido: string;
}

export class CreateGacetaDto extends PartialType(GacetaBase) {
  // Excluimos 'id' porque se genera automáticamente
  /**
   *
   */
  @ApiProperty({
    description: 'Fecha de publicación de la gaceta',
    example: '2024-11-06',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  declare fechaPublicacion: Date;

  /**
   *
   */
  @ApiProperty({
    description: 'Número de la gaceta',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  declare numeroGaceta: number;

  /**
   *
   */
  @ApiProperty({
    description: 'Volumen de la gaceta',
    example: 2024,
    minimum: 2020,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(2020)
  declare volumen: number;

  /**
   *
   */
  @ApiProperty({
    description: 'Fecha desde de la gaceta',
    example: '2024-11-01',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  declare desde: Date;

  /**
   * Api property of create gaceta dto
   */
  @ApiProperty({
    description: 'Fecha hasta de la gaceta',
    example: '2024-11-30',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  declare hasta: Date;

  /**
   *
   */
  @ApiProperty({
    description: 'URL de la gaceta',
    example: 'https://www.salud.gob.ec/gaceta/2024/11/gaceta-001.pdf',
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  declare urlGaceta: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Estado de la gaceta',
    enum: ['PUBLICADO', 'PENDIENTE', 'CANCELADO'],
    example: 'PENDIENTE',
  })
  @IsString()
  @IsNotEmpty()
  declare estado: ESTADO_GACETA;

  /**
   *
   */
  @ApiProperty({
    description: 'Autor principal de la gaceta',
    example: 'Dr. Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  declare autor: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Cargo del autor principal',
    example: 'Director de Farmacovigilancia',
  })
  @IsString()
  @IsNotEmpty()
  declare cargo: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Autor secundario de la gaceta',
    example: 'Dra. María González',
  })
  @IsString()
  @IsNotEmpty()
  declare autorSecundario: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Cargo del autor secundario',
    example: 'Subdirectora de Vigilancia Epidemiológica',
  })
  @IsString()
  @IsNotEmpty()
  declare cargoSecundario: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Análisis de gravedad (soporta HTML/texto enriquecido)',
    example: '<h3>Análisis de Gravedad</h3><p>Durante el período analizado...</p>',
  })
  @IsString()
  @IsNotEmpty()
  declare analisisGravedad: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Análisis de sexo y edad (soporta HTML/texto enriquecido)',
    example:
      '<h3>Distribución por Sexo y Edad</h3><ul><li>Mujeres: 60%</li><li>Hombres: 40%</li></ul>',
  })
  @IsString()
  @IsNotEmpty()
  declare analisisSexoEdad: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Análisis de tipo de evento (soporta HTML/texto enriquecido)',
    example: '<h3>Tipos de Eventos</h3><p>Los eventos más frecuentes fueron...</p>',
  })
  @IsString()
  @IsNotEmpty()
  declare analisisTipoEvento: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Análisis geográfico (soporta HTML/texto enriquecido)',
    example: '<h3>Distribución Geográfica</h3><p>Las provincias con mayor incidencia...</p>',
  })
  @IsString()
  @IsNotEmpty()
  declare analisisGeografico: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Resumen del contenido (soporta HTML/texto enriquecido)',
    example: '<h2>Resumen Ejecutivo</h2><p>Este informe presenta...</p>',
  })
  @IsString()
  @IsNotEmpty()
  declare resumenContenido: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Conclusiones (soporta HTML/texto enriquecido)',
    example: '<h3>Conclusiones</h3><ol><li>El perfil de seguridad...</li></ol>',
  })
  @IsString()
  @IsNotEmpty()
  declare conclusiones: string;

  /**
   *
   */
  @ApiProperty({
    description: 'Recomendaciones (soporta HTML/texto enriquecido)',
    example: '<h3>Recomendaciones</h3><p>Se recomienda continuar...</p>',
  })
  @IsString()
  @IsNotEmpty()
  declare recomendaciones: string;
}
