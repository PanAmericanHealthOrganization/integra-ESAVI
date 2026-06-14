import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataType } from '../enum/data-type.enum';
import { ComparisonType } from '../enum/comparison-type.enum';
import { Homologation } from '../entity/homologation.entity';
import { Homologator } from '../entity/homologator.entity';
import { ResolveRequestDto } from '../dto/resolve-request.dto';

export interface ResolveResult {
  matched: boolean;
  sourceValue: string;
  targetValue: string;
  castedValue: string | number | boolean;
  targetType?: DataType;
}

@Injectable()
export class ResolverService {
  private readonly logger = new Logger(ResolverService.name);

  constructor(
    @InjectRepository(Homologator, 'POSTGRES_INTEGRATOR_DS')
    private readonly homologatorRepo: Repository<Homologator>,
    @InjectRepository(Homologation, 'POSTGRES_INTEGRATOR_DS')
    private readonly homologationRepo: Repository<Homologation>,
  ) {}

  async resolve(dto: ResolveRequestDto): Promise<ResolveResult> {
    const { entity, field, sourceSystem, sourceValue } = dto;

    const homologator = await this.homologatorRepo.findOne({ where: { entity, field, isActive: true } });

    if (!homologator) {
      this.logger.warn(`No homologator found for entity="${entity}" field="${field}"`);
      return { matched: false, sourceValue, targetValue: sourceValue, castedValue: sourceValue };
    }

    const rules = await this.homologationRepo.find({
      where: { homologatorId: homologator.id, sourceSystem, isActive: true },
      order: { priority: 'ASC' },
    });

    for (const rule of rules) {
      if (this.matches(rule, sourceValue)) {
        const castedValue = this.cast(rule.targetValue, homologator.targetType);
        return {
          matched: true,
          sourceValue,
          targetValue: rule.targetValue,
          castedValue,
          targetType: homologator.targetType,
        };
      }
    }

    this.logger.warn(`No rule matched for entity="${entity}" field="${field}" system="${sourceSystem}" value="${sourceValue}"`);
    return { matched: false, sourceValue, targetValue: sourceValue, castedValue: sourceValue };
  }

  private matches(rule: Homologation, value: string): boolean {
    const flags = rule.caseSensitive ? '' : 'i';
    const a = rule.caseSensitive ? value : value.toLowerCase();
    const b = rule.caseSensitive ? rule.sourceValue : rule.sourceValue.toLowerCase();

    switch (rule.comparisonType) {
      case ComparisonType.EQUALS:
        return a === b;
      case ComparisonType.CONTAINS:
        return a.includes(b);
      case ComparisonType.STARTS_WITH:
        return a.startsWith(b);
      case ComparisonType.ENDS_WITH:
        return a.endsWith(b);
      case ComparisonType.REGEX:
        try {
          return new RegExp(rule.sourceValue, flags).test(value);
        } catch {
          this.logger.error(`Regex inválido en regla ${rule.id}: "${rule.sourceValue}"`);
          return false;
        }
      default:
        return false;
    }
  }

  private cast(value: string, targetType: DataType): string | number | boolean {
    switch (targetType) {
      case DataType.NUMBER:
        return Number(value);
      case DataType.BOOLEAN:
        return value === 'true' || value === '1';
      default:
        return value;
    }
  }
}
