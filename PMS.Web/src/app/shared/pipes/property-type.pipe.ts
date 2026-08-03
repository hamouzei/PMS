import { Pipe, PipeTransform } from '@angular/core';
import { PropertyType } from '../../core/models/master-data.model';

@Pipe({
  name: 'propertyType',
  standalone: true
})
export class PropertyTypePipe implements PipeTransform {
  transform(value: PropertyType | number | string | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    const typeEnum = typeof value === 'number' ? (value as PropertyType) : PropertyType[value as keyof typeof PropertyType];
    return typeEnum === PropertyType.FixedAsset ? 'Fixed Asset' : 'Consumable';
  }
}
