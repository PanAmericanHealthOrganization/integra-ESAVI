import { IsEmail, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEstablecimientoDto {
  @IsString()
  @MaxLength(10)
  uniCodigo: string;

  @IsString()
  @MaxLength(100)
  uniNombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(6)
  parroquiaCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zonaCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  zonaDescripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  distritoCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  distritoDescripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  circuitoCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoEntidad?: string;

  @IsOptional()
  @IsNumber()
  longitudGps?: number;

  @IsOptional()
  @IsNumber()
  latitudGps?: number;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  mail?: string;
}

export class UpdateEstablecimientoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  uniNombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(6)
  parroquiaCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zonaCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  zonaDescripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  distritoCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  distritoDescripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  circuitoCodigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoEntidad?: string;

  @IsOptional()
  @IsNumber()
  longitudGps?: number;

  @IsOptional()
  @IsNumber()
  latitudGps?: number;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  mail?: string;
}

export class EstablecimientoDto extends CreateEstablecimientoDto {
  id: string;
}
