import {PartialType} from "@nestjs/swagger";

export class CreateMedicamentoDto {
  rolMedicamento: string;
  codigoATC: string;
  sistemaCodificacion: string;
  nombre: string;
  nombreMedPatenteWHODrug: string;
  nombreFormaFarmaceutica: string;
  nombreViaAdministracion: string;
}

export class UpdateMedicamentoDto extends PartialType(CreateMedicamentoDto) {}
