import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGeneroDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  codigo: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;
}
