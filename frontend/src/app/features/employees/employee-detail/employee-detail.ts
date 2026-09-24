import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { Employee } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { resolveFileUrl } from '../../../core/utils/file-url.util';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { SalaryFormatPipe } from '../../../shared/pipes/salary-format-pipe';

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    LoadingSpinner,
    EmptyState,
    StatusBadge,
    SalaryFormatPipe,
  ],
  selector: 'app-employee-detail',
  styleUrl: './employee-detail.scss',
  templateUrl: './employee-detail.html',
})
export class EmployeeDetail {
  private readonly employeeApi = inject(EmployeeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  private readonly basePath = this.route.snapshot.data['basePath'] as string;
  protected readonly canManage = this.route.snapshot.data['canManage'] !== false;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly employee = signal<Employee | null>(null);
  protected readonly resolveFileUrl = resolveFileUrl;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Missing employee id.');
      this.loading.set(false);
      return;
    }

    this.employeeApi.getById(id).subscribe({
      next: ({ data }) => {
        this.employee.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Unable to load this employee.'));
        this.loading.set(false);
      },
    });
  }

  protected edit(): void {
    const employee = this.employee();
    if (employee) {
      this.router.navigate([this.basePath, employee.id, 'edit']);
    }
  }

  protected back(): void {
    this.router.navigate([this.basePath]);
  }

  protected remove(): void {
    const employee = this.employee();
    if (!employee) return;

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
          next: () => this.router.navigate([this.basePath]),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this employee.')),
        });
      });
  }
}
