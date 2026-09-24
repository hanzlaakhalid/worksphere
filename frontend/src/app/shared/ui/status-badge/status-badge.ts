import { Component, computed, input } from '@angular/core';
import { EmployeeStatus } from '../../../core/models/employee.model';
import { EmployeeStatusPipe } from '../../pipes/employee-status-pipe';

const COLOR_CLASS: Record<EmployeeStatus, string> = {
  ACTIVE: 'status-active',
  ON_LEAVE: 'status-on-leave',
  INACTIVE: 'status-inactive',
  TERMINATED: 'status-terminated',
};

@Component({
  imports: [EmployeeStatusPipe],
  selector: 'app-status-badge',
  styleUrl: './status-badge.scss',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<EmployeeStatus>();
  protected readonly colorClass = computed(() => COLOR_CLASS[this.status()]);
}
