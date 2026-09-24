import { Pipe, PipeTransform } from '@angular/core';
import { EmployeeStatus } from '../../core/models/employee.model';

const LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  TERMINATED: 'Terminated',
};

@Pipe({
  name: 'employeeStatus',
})
export class EmployeeStatusPipe implements PipeTransform {
  transform(value: EmployeeStatus | null | undefined): string {
    return value ? (LABELS[value] ?? value) : '—';
  }
}
