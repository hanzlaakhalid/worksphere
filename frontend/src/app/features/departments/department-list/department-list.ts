import { Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DepartmentApi } from '../../../core/departments/department-api';
import { Department } from '../../../core/models/department.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { DepartmentFormDialog, DepartmentFormDialogData } from '../department-form-dialog/department-form-dialog';

@Component({
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, DataTable],
  selector: 'app-department-list',
  styleUrl: './department-list.scss',
  templateUrl: './department-list.html',
})
export class DepartmentList {
  private readonly departmentApi = inject(DepartmentApi);
  private readonly dialog = inject(MatDialog);

  protected readonly displayedColumns = ['name', 'description', 'manager', 'employeeCount', 'actions'];

  protected readonly loading = signal(true);
  protected readonly departments = signal<Department[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.departmentApi.list().subscribe({
      next: (res) => {
        this.departments.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Unable to load departments.'));
        this.loading.set(false);
      },
    });
  }

  protected openCreateDialog(): void {
    this.openDialog(null);
  }

  protected openEditDialog(department: Department, event: Event): void {
    event.stopPropagation();
    this.openDialog(department);
  }

  private openDialog(department: Department | null): void {
    this.dialog
      .open<DepartmentFormDialog, DepartmentFormDialogData>(DepartmentFormDialog, { data: { department } })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  protected deleteDepartment(department: Department, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Delete department',
          message: `Delete ${department.name}? Employees in this department will be unassigned, not deleted.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.departmentApi.delete(department.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this department.')),
        });
      });
  }
}
