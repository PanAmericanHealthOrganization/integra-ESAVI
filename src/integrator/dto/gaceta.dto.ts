import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ESTADO_GACETA, IGaceta } from '../entity/interfaces/gaceta.interface';

export class GacetaDto implements IGaceta {
  @ApiProperty({
    description: 'ID único de la gaceta',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha de publicación de la gaceta',
    example: '2024-11-06T00:00:00.000Z',
  })
  fechaPublicacion: Date;

  @ApiProperty({
    description: 'Número de la gaceta',
    example: 1,
  })
  numeroGaceta: number;

  @ApiProperty({
    description: 'Volumen de la gaceta',
    example: 2024,
  })
  volumen: number;

  @ApiProperty({
    description: 'Año de la gaceta',
    example: 2024,
  })
  anio: number;

  @ApiProperty({
    description: 'Mes de la gaceta',
    example: 11,
  })
  mes: number;

  @ApiProperty({
    description: 'URL de la gaceta',
    example: 'https://www.salud.gob.ec/gaceta/2024/11/gaceta-001.pdf',
  })
  urlGaceta: string;

  @ApiProperty({
    description: 'Estado de la gaceta',
    enum: ['PUBLICADO', 'PENDIENTE', 'CANCELADO'],
    example: 'PUBLICADO',
  })
  estado: ESTADO_GACETA;

  @ApiProperty({
    description: 'Autor principal de la gaceta',
    example: 'Dr. Juan Pérez',
  })
  autor: string;

  @ApiProperty({
    description: 'Cargo del autor principal',
    example: 'Director de Farmacovigilancia',
  })
  cargo: string;

  @ApiProperty({
    description: 'Autor secundario de la gaceta',
    example: 'Dra. María González',
  })
  autorSecundario: string;

  @ApiProperty({
    description: 'Cargo del autor secundario',
    example: 'Subdirectora de Vigilancia Epidemiológica',
  })
  cargoSecundario: string;

  @ApiProperty({
    description: 'Análisis de gravedad (HTML/texto enriquecido)',
    example: '<h3>Análisis de Gravedad</h3><p>Durante el período analizado...</p>',
  })
  analisisGravedad: string;

  @ApiProperty({
    description: 'Análisis de sexo y edad (HTML/texto enriquecido)',
    example: '<h3>Distribución por Sexo y Edad</h3>',
  })
  analisisSexoEdad: string;

  @ApiProperty({
    description: 'Análisis de tipo de evento (HTML/texto enriquecido)',
    example: '<h3>Tipos de Eventos</h3>',
  })
  analisisTipoEvento: string;

  @ApiProperty({
    description: 'Análisis geográfico (HTML/texto enriquecido)',
    example: '<h3>Distribución Geográfica</h3>',
  })
  analisisGeografico: string;

  @ApiProperty({
    description: 'Resumen del contenido (HTML/texto enriquecido)',
    example: '<h2>Resumen Ejecutivo</h2>',
  })
  resumenContenido: string;

  @ApiProperty({
    description: 'Conclusiones (HTML/texto enriquecido)',
    example: '<h3>Conclusiones</h3>',
  })
  conclusiones: string;

  @ApiProperty({
    description: 'Recomendaciones (HTML/texto enriquecido)',
    example: '<h3>Recomendaciones</h3>',
  })
  recomendaciones: string;
}

export class GacetaFilterDto {
  @ApiProperty({
    description: 'Filtrar por número de gaceta',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  numeroGaceta?: number;

  @ApiProperty({
    description: 'Filtrar por año',
    example: 2024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  anio?: number;

  @ApiProperty({
    description: 'Filtrar por mes',
    example: 11,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  mes?: number;

  @ApiProperty({
    description: 'Filtrar por estado',
    enum: ['PUBLICADO', 'PENDIENTE', 'CANCELADO'],
    required: false,
  })
  @IsOptional()
  @IsString()
  estado?: ESTADO_GACETA;

  @ApiProperty({
    description: 'Filtrar por autor',
    example: 'Dr. Juan Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  autor?: string;

  @ApiProperty({
    description: 'Filtrar por fecha de publicación (desde)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaPublicacionDesde?: string;

  @ApiProperty({
    description: 'Filtrar por fecha de publicación (hasta)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaPublicacionHasta?: string;
}
