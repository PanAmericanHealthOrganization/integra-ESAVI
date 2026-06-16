import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveRequestDto {
  @IsString()
  @IsNotEmpty()
  entity: string;

  @IsString()
  @IsNotEmpty()
  field: string;

  @IsString()
  @IsNotEmpty()
  sourceSystem: string;

  @IsString()
  @IsNotEmpty()
  sourceValue: string;
}
