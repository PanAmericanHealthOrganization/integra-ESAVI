import { IsEmail, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  @IsUUID()
  tipoEntidadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

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
  @IsUUID()
  tipoEntidadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

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
