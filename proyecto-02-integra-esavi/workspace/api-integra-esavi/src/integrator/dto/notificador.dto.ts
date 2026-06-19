import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateNotificadorDto {
  @IsString()
  @MaxLength(20)
  identificacion: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nombres?: string;

  @IsUUID()
  @IsOptional()
  profesionId?: string;
}

export class UpdateNotificadorDto extends PartialType(CreateNotificadorDto) {}
