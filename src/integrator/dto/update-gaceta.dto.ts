import { OmitType, PartialType } from '@nestjs/swagger';
import { GacetaDto } from './gaceta.dto';

export class UpdateGacetaDto extends OmitType(PartialType(GacetaDto), [
  'fechaPublicacion',
  'graficoAnalisisPoblacion',
  'graficoAnalisisDistribucionGeografica',
  'graficoAnalisisDistribucionTipoEvento',
  'graficoAnalisisDistribucionVacunas',
  'graficoAnalisisPorGravedad',
  'graficoAnalisisTemporal',
  'desde',
  'hasta',
] as const) {}
