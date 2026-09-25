import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { SalaryFormatPipe } from '../../../shared/pipes/salary-format-pipe';
import { PayrollApi } from '../../../core/payroll/payroll-api';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { PaymentStatus, Payroll } from '../../../core/models/payroll.model';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { paymentStatusVariant } from '../../../core/utils/status-variant.util';
import { PayrollFormDialog, PayrollFormDialogData } from '../payroll-form-dialog/payroll-form-dialog';

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['PENDING', 'PAID'];

@Component({
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    DataTable,
    Pagination,
    StatusBadge,
    SalaryFormatPipe,
  ],
  selector: 'app-payroll-list',
  styleUrl: './payroll-list.scss',
  templateUrl: './payroll-list.html',
})
export class PayrollList {
  private readonly payrollApi = inject(PayrollApi);
  private readonly employeeApi = inject(EmployeeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** 'self' (employee/manager: own payslip history) vs 'manage' (HR/Admin: manage every employee's records). */
  protected readonly mode = (this.route.snapshot.data['mode'] as 'self' | 'manage') ?? 'self';

  protected readonly displayedColumns =
    this.mode === 'manage'
      ? ['employee', 'month', 'basicSalary', 'netSalary', 'paymentStatus', 'actions']
      : ['month', 'basicSalary', 'allowances', 'bonuses', 'deductions', 'tax', 'netSalary', 'paymentStatus'];

  protected readonly paymentStatusOptions = PAYMENT_STATUS_OPTIONS;
  protected readonly paymentStatusVariant = paymentStatusVariant;

  protected readonly loading = signal(true);
  protected readonly records = signal<Payroll[]>([]);
  protected readonly total = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly employeeOptions = signal<EmployeeOption[]>([]);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly employeeFilter = signal<string | null>(null);
  protected readonly paymentStatusFilter = signal<PaymentStatus | null>(null);
  private readonly refreshTrigger = signal(0);

  constructor() {
    if (this.mode === 'manage') {
      this.employeeApi.options().subscribe({ next: (res) => this.employeeOptions.set(res.data) });
    }

    combineLatest([
      toObservable(this.employeeFilter),
      toObservable(this.paymentStatusFilter),
      toObservable(this.page),
      toObservable(this.pageSize),
      toObservable(this.refreshTrigger),
    ])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([employeeId, paymentStatus, page, pageSize]) =>
          this.payrollApi
            .list({ page, pageSize, employeeId: employeeId ?? undefined, paymentStatus: paymentStatus ?? undefined })
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load payroll records.') }))),
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

  protected onEmployeeFilterChange(value: string | null): void {
    this.employeeFilter.set(value);
    this.page.set(1);
  }

  protected onPaymentStatusFilterChange(value: PaymentStatus | null): void {
    this.paymentStatusFilter.set(value);
    this.page.set(1);
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  protected openAddDialog(): void {
    this.dialog
      .open<PayrollFormDialog, PayrollFormDialogData>(PayrollFormDialog, {
        data: { payroll: null, employeeOptions: this.employeeOptions() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }

  protected openEditDialog(record: Payroll): void {
    this.dialog
      .open<PayrollFormDialog, PayrollFormDialogData>(PayrollFormDialog, {
        data: { payroll: record, employeeOptions: this.employeeOptions() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }

  protected deleteRecord(record: Payroll, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Delete Payroll Record',
          message: `Delete the payroll record for ${record.employee.firstName} ${record.employee.lastName} (${new Date(record.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.payrollApi.delete(record.id).subscribe({
          next: () => this.refreshTrigger.update((n) => n + 1),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this record.')),
        });
      });
  }
}
