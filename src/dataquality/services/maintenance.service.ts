import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';
import { GeneralService } from './general.service';

@Injectable()
export class DataqualityMaintenanceService {
  constructor(
    @InjectRepository(DataQualityDimensions, 'DATAQUALITY_DS')
    private readonly dataQualityDimensionsRepository: Repository<DataQualityDimensions>,
    private readonly generalService: GeneralService,
  ) {}

  async deleteAllEvaluations(): Promise<{ deleted: number }> {
    const result = await this.dataQualityDimensionsRepository
      .createQueryBuilder()
      .delete()
      .from(DataQualityDimensions)
      .execute();

    return { deleted: result.affected ?? 0 };
  }

  async evaluateLastMonth(): Promise<{ processedDays: number; dates: Date[] }> {
    const today = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const processedDates: Date[] = [];
    for (
      let cursor = new Date(firstDayPrevMonth);
      cursor <= lastDayPrevMonth;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const day = new Date(cursor);
      await this.generalService.processQualityDay(day);
      processedDates.push(new Date(day));
    }

    return { processedDays: processedDates.length, dates: processedDates };
  }
}

