import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class AefiQuery {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  codigoATC: string;
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsDateString(
    {},
    { message: 'fechaInicio should be in the format YYYY-MM-dd' },
  )
  fechaInicio: string;
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({}, { message: 'endDate should be in the format YYYY-MM-dd' })
  fechaFin: string;
}
