import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'etbCurrency',
  standalone: true
})
export class CurrencyFormatterPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'ETB 0.00';
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
