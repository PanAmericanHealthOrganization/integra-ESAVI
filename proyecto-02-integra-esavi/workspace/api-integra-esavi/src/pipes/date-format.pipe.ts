import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class DateFormatPipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    const formattedDate = moment(value, 'YYYY-MM-DD', true);
    if (!formattedDate.isValid()) {
      throw new BadRequestException(
        'Invalid date format. Please provide the date in YYYY-MM-DD format.',
      );
    }
    return formattedDate.toDate();
  }
}
