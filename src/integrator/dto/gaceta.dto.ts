import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { ESTADO_GACETA, IGaceta } from '../entity/interfaces/gaceta.interface';

export class GacetaDto implements IGaceta {
  @ApiProperty({
    description: 'ID único de la gaceta',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id?: string;

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
    description: 'Fecha desde de la gaceta',
    example: '2024-11-01T00:00:00.000Z',
  })
  desde: Date;

  @ApiProperty({
    description: 'Fecha hasta de la gaceta',
    example: '2024-11-30T00:00:00.000Z',
  })
  hasta: Date;

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
    description: 'Título de la gaceta',
    example: 'Análisis de Eventos Adversos en el Mes de Octubre 2024',
  })
  titulo: string;

  @ApiProperty({
    description: 'Resumen del contenido (HTML/texto enriquecido)',
    example: '<h2>Resumen Ejecutivo</h2>',
  })
  resumenContenido: string;

  @ApiProperty({
    description: 'Análisis de población (HTML/texto enriquecido)',
    example: '<h3>Análisis de población</h3>',
  })
  analisisPoblacion: string;

  @ApiProperty({
    description: 'Gráfico de análisis de población (Base64)',
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  graficoAnalisisPoblacion?: string;

  @ApiProperty({
    description: 'Análisis de distribución geográfica (HTML/texto enriquecido)',
    example: '<h3>Análisis de distribución geográfica</h3>',
  })
  analisisDistribucionGeografica: string;

  @ApiProperty({
    description: 'Gráfico de análisis de distribución geográfica (Base64)',
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  graficoAnalisisDistribucionGeografica?: string;

  @ApiProperty({
    description: 'Análisis de distribución de tipo de evento (HTML/texto enriquecido)',
    example: '<h3>Análisis de distribución de tipo de evento</h3>',
  })
  analisisDistribucionTipoEvento: string;

  @ApiProperty({
    description: 'Gráfico de análisis de distribución de tipo de evento (Base64)',
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  graficoAnalisisDistribucionTipoEvento?: string;

  @ApiProperty({
    description: 'Análisis de distribución de vacunas (HTML/texto enriquecido)',
    example: '<h3>Análisis de distribución de vacunas</h3>',
  })
  analisisDistribucionVacunas: string;

  @ApiProperty({
    description: 'Gráfico de análisis de distribución de vacunas (Base64)',
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  graficoAnalisisDistribucionVacunas?: string;

  @ApiProperty({
    description: 'Análisis por gravedad (HTML/texto enriquecido)',
    example: '<h3>Análisis por gravedad</h3>',
  })
  analisisPorGravedad: string;

  @ApiProperty({
    description: 'Gráfico de análisis por gravedad (Base64)',
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  graficoAnalisisPorGravedad?: string;

  @ApiProperty({
    description: 'Análisis temporal (HTML/texto enriquecido)',
    example: '<h3>Análisis temporal</h3>',
  })
  analisisTemporal: string;

  @ApiProperty({
    description: 'Gráfico de análisis temporal (Base64)',
    type: 'string',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  })
  graficoAnalisisTemporal?: string;

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
