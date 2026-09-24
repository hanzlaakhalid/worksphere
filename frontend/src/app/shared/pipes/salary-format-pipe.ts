import { Pipe, PipeTransform } from '@angular/core';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

@Pipe({
  name: 'salaryFormat',
})
export class SalaryFormatPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const num = typeof value === 'string' ? Number(value) : value;
    return Number.isNaN(num) ? '—' : formatter.format(num);
  }
}
