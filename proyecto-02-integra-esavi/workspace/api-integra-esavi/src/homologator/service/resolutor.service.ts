import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudResolucionDto } from '../dto';
import { Homologador } from '../entity/homologador.entity';
import { ReglaHomologacion } from '../entity/regla-homologacion.entity';
import { TipoComparacion } from '../enum/tipo-comparacion.enum';
import { TipoDato } from '../enum/tipo-dato.enum';

export interface ResultadoResolucion {
  coincidio: boolean;
  valorOrigen: string;
  valorDestino: string;
  valorCasteado: string | number | boolean;
  tipoDato?: TipoDato;
}

@Injectable()
export class ResolutorService {
  private readonly logger = new Logger(ResolutorService.name);

  constructor(
    @InjectRepository(Homologador, 'POSTGRES_INTEGRATOR_DS')
    private readonly homologadorRepo: Repository<Homologador>,
    @InjectRepository(ReglaHomologacion, 'POSTGRES_INTEGRATOR_DS')
    private readonly reglaRepo: Repository<ReglaHomologacion>,
  ) {}

  async resolver(dto: SolicitudResolucionDto): Promise<ResultadoResolucion> {
    const { entity, field, sourceSystem, sourceValue } = dto;

    const homologador = await this.homologadorRepo.findOne({ where: { entity, field, isActive: true } });

    if (!homologador) {
      this.logger.warn(`Sin homologador para entity="${entity}" field="${field}"`);
      return { coincidio: false, valorOrigen: sourceValue, valorDestino: sourceValue, valorCasteado: sourceValue };
    }

    const reglas = await this.reglaRepo.find({
      where: { homologadorId: homologador.id, sourceSystem, isActive: true },
      order: { priority: 'ASC' },
    });

    for (const regla of reglas) {
      if (this.coincide(regla, sourceValue)) {
        const valorCasteado = this.castear(regla.targetValue, homologador.targetType);
        return {
          coincidio: true,
          valorOrigen: sourceValue,
          valorDestino: regla.targetValue,
          valorCasteado,
          tipoDato: homologador.targetType,
        };
      }
    }

    this.logger.warn(`Sin regla coincidente para entity="${entity}" field="${field}" system="${sourceSystem}" value="${sourceValue}"`);
    return { coincidio: false, valorOrigen: sourceValue, valorDestino: sourceValue, valorCasteado: sourceValue };
  }

  private coincide(regla: ReglaHomologacion, valor: string): boolean {
    const flags = regla.caseSensitive ? '' : 'i';
    const a = regla.caseSensitive ? valor : valor.toLowerCase();
    const b = regla.caseSensitive ? regla.sourceValue : regla.sourceValue.toLowerCase();

    switch (regla.comparisonType) {
      case TipoComparacion.EQUALS:
        return a === b;
      case TipoComparacion.CONTAINS:
        return a.includes(b);
      case TipoComparacion.STARTS_WITH:
        return a.startsWith(b);
      case TipoComparacion.ENDS_WITH:
        return a.endsWith(b);
      case TipoComparacion.REGEX:
        try {
          return new RegExp(regla.sourceValue, flags).test(valor);
        } catch {
          this.logger.error(`Regex inválido en regla ${regla.id}: "${regla.sourceValue}"`);
          return false;
        }
      default:
        return false;
    }
  }

  private castear(valor: string, tipoDato: TipoDato): string | number | boolean {
    switch (tipoDato) {
      case TipoDato.NUMBER:
        return Number(valor);
      case TipoDato.BOOLEAN:
        return valor === 'true' || valor === '1';
      default:
        return valor;
    }
  }
}
