import { Injectable, signal } from '@angular/core';
import { EthiopianDate, formatEthiopianDate, toEthiopianDate } from '../utils/ethiopian-date-converter';

@Injectable({
  providedIn: 'root'
})
export class EthiopianCalendarService {
  private readonly currentEfyDate = signal<EthiopianDate>(toEthiopianDate(new Date()));

  public readonly currentFiscalYear = signal<number>(this.currentEfyDate().year);

  public convertToEfy(gregorianDate: Date | string): EthiopianDate {
    return toEthiopianDate(gregorianDate);
  }

  public formatEfy(gregorianDate: Date | string, useAmharic = false): string {
    return formatEthiopianDate(gregorianDate, useAmharic);
  }
}
