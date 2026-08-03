import { Pipe, PipeTransform, inject } from '@angular/core';
import { EthiopianCalendarService } from '../../core/services/ethiopian-calendar.service';

@Pipe({
  name: 'ethiopianDate',
  standalone: true
})
export class EthiopianDatePipe implements PipeTransform {
  private readonly ethCalendar = inject(EthiopianCalendarService);

  transform(value: Date | string | null | undefined, useAmharic = false): string {
    if (!value) return '-';
    return this.ethCalendar.formatEfy(value, useAmharic);
  }
}
