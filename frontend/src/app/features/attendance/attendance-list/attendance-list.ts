import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { DashboardCard } from '../../../shared/ui/dashboard-card/dashboard-card';
import { AttendanceApi } from '../../../core/attendance/attendance-api';
import { DepartmentApi } from '../../../core/departments/department-api';
import { Attendance, AttendanceStats, AttendanceStatus } from '../../../core/models/attendance.model';
import { Department } from '../../../core/models/department.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { attendanceStatusVariant } from '../../../core/utils/status-variant.util';

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'];
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  ABSENT: 'Absent',
  ON_LEAVE: 'On Leave',
};

@Component({
  imports: [
    DatePipe,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    DataTable,
    Pagination,
    StatusBadge,
    DashboardCard,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-attendance-list',
  styleUrl: './attendance-list.scss',
  templateUrl: './attendance-list.html',
})
export class AttendanceList {
  private readonly attendanceApi = inject(AttendanceApi);
  private readonly departmentApi = inject(DepartmentApi);
  private readonly route = inject(ActivatedRoute);

  /** 'self' (employee, no filters/stats) vs 'scoped' (manager/hr/admin - team or org-wide). */
  protected readonly scope = (this.route.snapshot.data['scope'] as 'self' | 'scoped') ?? 'scoped';

  protected readonly displayedColumns = this.scope === 'self'
    ? ['date', 'checkIn', 'checkOut', 'workingHours', 'status']
    : ['date', 'employee', 'department', 'checkIn', 'checkOut', 'workingHours', 'status'];

  protected readonly statusOptions = STATUS_OPTIONS;

  protected statusLabel(status: AttendanceStatus): string {
    return STATUS_LABELS[status];
  }

  protected readonly loading = signal(true);
  protected readonly records = signal<Attendance[]>([]);
  protected readonly total = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly departments = signal<Department[]>([]);
  protected readonly stats = signal<AttendanceStats | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly departmentFilter = signal<string | null>(null);
  protected readonly statusFilter = signal<AttendanceStatus | null>(null);
  protected readonly dateFrom = signal<Date | null>(null);
  protected readonly dateTo = signal<Date | null>(null);

  protected readonly attendanceStatusVariant = attendanceStatusVariant;

  constructor() {
    if (this.scope === 'scoped') {
      this.departmentApi.list().subscribe({ next: (res) => this.departments.set(res.data) });
      this.attendanceApi.statsToday().subscribe({ next: (res) => this.stats.set(res.data) });
    }

    combineLatest([
      toObservable(this.departmentFilter),
      toObservable(this.statusFilter),
      toObservable(this.dateFrom),
      toObservable(this.dateTo),
      toObservable(this.page),
      toObservable(this.pageSize),
    ])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([department, status, dateFrom, dateTo, page, pageSize]) =>
          this.attendanceApi
            .list({
              page,
              pageSize,
              department: department ?? undefined,
              status: status ?? undefined,
              dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
              dateTo: dateTo ? dateTo.toISOString() : undefined,
            })
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load attendance records.') }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.records.set([]);
          this.total.set(0);
          return;
        }
        this.records.set(result.data);
        this.total.set(result.total);
      });
  }

  protected onDepartmentFilterChange(value: string | null): void {
    this.departmentFilter.set(value);
    this.page.set(1);
  }

  protected onStatusFilterChange(value: AttendanceStatus | null): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  protected onDateFromChange(value: Date | null): void {
    this.dateFrom.set(value);
    this.page.set(1);
  }

  protected onDateToChange(value: Date | null): void {
    this.dateTo.set(value);
    this.page.set(1);
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }
}
