import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { SearchInput } from '../../../shared/ui/search-input/search-input';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { DepartmentApi } from '../../../core/departments/department-api';
import { Employee, EmployeeListQuery, EmployeeStatus } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { resolveFileUrl } from '../../../core/utils/file-url.util';
import { employeeStatusVariant } from '../../../core/utils/status-variant.util';
import { EmployeeStatusPipe } from '../../../shared/pipes/employee-status-pipe';

const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED'];

@Component({
  imports: [
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    DataTable,
    SearchInput,
    Pagination,
    StatusBadge,
    DatePipe,
    EmployeeStatusPipe,
  ],
  selector: 'app-employee-list',
  styleUrl: './employee-list.scss',
  templateUrl: './employee-list.html',
})
export class EmployeeList {
  private readonly employeeApi = inject(EmployeeApi);
  private readonly departmentApi = inject(DepartmentApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** ADMIN/HR_MANAGER can create/edit/delete; MANAGER sees a read-only view of their team. */
  protected readonly canManage = this.route.snapshot.data['canManage'] !== false;
  /** These are flat sibling routes (employees, employees/new, employees/:id, ...), not nested children. */
  private readonly basePath = this.route.snapshot.data['basePath'] as string;

  protected readonly displayedColumns = ['employeeCode', 'name', 'department', 'position', 'manager', 'status', 'joiningDate', 'actions'];
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly loading = signal(true);
  protected readonly employees = signal<Employee[]>([]);
  protected readonly total = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly departments = signal<Department[]>([]);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly search = signal('');
  protected readonly departmentFilter = signal<string | null>(null);
  protected readonly statusFilter = signal<EmployeeStatus | null>(null);
  protected readonly sortBy = signal<EmployeeListQuery['sortBy']>('firstName');
  protected readonly sortOrder = signal<'asc' | 'desc'>('asc');
  private readonly refreshTrigger = signal(0);

  protected readonly resolveFileUrl = resolveFileUrl;
  protected readonly employeeStatusVariant = employeeStatusVariant;

  constructor() {
    this.departmentApi.list().subscribe({ next: (res) => this.departments.set(res.data) });

    combineLatest([
      toObservable(this.search),
      toObservable(this.departmentFilter),
      toObservable(this.statusFilter),
      toObservable(this.page),
      toObservable(this.pageSize),
      toObservable(this.sortBy),
      toObservable(this.sortOrder),
      toObservable(this.refreshTrigger),
    ])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([search, department, status, page, pageSize, sortBy, sortOrder]) =>
          this.employeeApi
            .list({
              page,
              pageSize,
              search: search || undefined,
              department: department ?? undefined,
              status: status ?? undefined,
              sortBy,
              sortOrder,
            })
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load employees.') }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.employees.set([]);
          this.total.set(0);
          return;
        }
        this.employees.set(result.data);
        this.total.set(result.total);
      });
  }

  protected onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected onDepartmentFilterChange(value: string | null): void {
    this.departmentFilter.set(value);
    this.page.set(1);
  }

  protected onStatusFilterChange(value: EmployeeStatus | null): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  protected onSortChange(sort: Sort): void {
    if (!sort.direction) {
      this.sortBy.set('firstName');
      this.sortOrder.set('asc');
    } else {
      this.sortBy.set(sort.active as EmployeeListQuery['sortBy']);
      this.sortOrder.set(sort.direction);
    }
    this.page.set(1);
  }

  protected viewEmployee(employee: Employee): void {
    this.router.navigate([this.basePath, employee.id]);
  }

  protected addEmployee(): void {
    this.router.navigate([this.basePath, 'new']);
  }

  protected editEmployee(employee: Employee, event: Event): void {
    event.stopPropagation();
    this.router.navigate([this.basePath, employee.id, 'edit']);
  }

  protected deleteEmployee(employee: Employee, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Delete employee',
          message: `Delete ${employee.firstName} ${employee.lastName}? This will permanently remove their account and cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.employeeApi.delete(employee.id).subscribe({
          next: () => this.refreshTrigger.update((n) => n + 1),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this employee.')),
        });
      });
  }
}
