import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DepartmentApi } from '../../../core/departments/department-api';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { Department } from '../../../core/models/department.model';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';

export interface DepartmentFormDialogData {
  department: Department | null;
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    Modal,
  ],
  selector: 'app-department-form-dialog',
  styleUrl: './department-form-dialog.scss',
  templateUrl: './department-form-dialog.html',
})
export class DepartmentFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly departmentApi = inject(DepartmentApi);
  private readonly employeeApi = inject(EmployeeApi);
  private readonly dialogRef = inject(MatDialogRef<DepartmentFormDialog>);
  protected readonly data = inject<DepartmentFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.department;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly managers = signal<EmployeeOption[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.department?.name ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [this.data.department?.description ?? ''],
    managerId: this.fb.control<string | null>(this.data.department?.manager?.id ?? null),
  });

  constructor() {
    this.employeeApi.options().subscribe({ next: (res) => this.managers.set(res.data) });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();

    const request$ =
      this.isEditMode && this.data.department
        ? this.departmentApi.update(this.data.department.id, value)
        : this.departmentApi.create(value);

    request$.subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.dialogRef.close(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this department.'));
      },
    });
  }
}
