import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMonth, getYear } from 'date-fns';
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

  /**
   *
   * @returns
   */
  async deleteAllEvaluations(): Promise<{ deleted: number }> {
    const result = await this.dataQualityDimensionsRepository
      .createQueryBuilder()
      .delete()
      .from(DataQualityDimensions)
      .execute();

    return { deleted: result.affected ?? 0 };
  }

  /**
   *
   * @returns
   */
  async evaluateLastMonth(): Promise<{ processedDays: number; dates: Date[] }> {
    const today = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const processedDates: Date[] = [];
    for (let cursor = new Date(firstDayPrevMonth); cursor <= lastDayPrevMonth; cursor.setDate(cursor.getDate() + 1)) {
      const day = new Date(cursor);
      await this.generalService.processQualityDay(day);
      processedDates.push(new Date(day));
    }

    return { processedDays: processedDates.length, dates: processedDates };
  }

  /**
   *
   * @param start
   * @param end
   */
  public async evaluateQualityInDateRange(start: Date, end: Date): Promise<void> {
    const startYear = getYear(start);
    const startMonth = getMonth(start) + 1;
    const endYear = getYear(end);
    const endMonth = getMonth(end) + 1;

    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 1;
      const monthEnd = year === endYear ? endMonth : 12;

      for (let month = monthStart; month <= monthEnd; month++) {
        const day = new Date(year, month - 1, 1);
        await this.generalService.processQualityDay(day);
      }
    }
  }
}
