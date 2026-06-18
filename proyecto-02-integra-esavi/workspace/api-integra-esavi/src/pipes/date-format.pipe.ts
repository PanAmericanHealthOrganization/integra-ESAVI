import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { parse, isValid } from 'date-fns';

@Injectable()
export class DateFormatPipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(
        'Invalid date format. Please provide the date in YYYY-MM-DD format.',
      );
    }
    const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) {
      throw new BadRequestException(
        'Invalid date format. Please provide the date in YYYY-MM-DD format.',
      );
    }
    return parsedDate;
  }
}
