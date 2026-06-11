import { IsString, IsOptional } from 'class-validator';

export class CreateCtSymptom2lltDto {
    @IsString()
    item: string;

    @IsString()
    symptom: string;

    @IsString()
    @IsOptional()
    lltName?: string;

    @IsString()
    @IsOptional()
    lltCode?: string;

    @IsString()
    @IsOptional()
    observation?: string;
}
