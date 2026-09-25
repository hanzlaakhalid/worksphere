import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayrollApi } from '../../../core/payroll/payroll-api';
import { Payroll, PaymentStatus } from '../../../core/models/payroll.model';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';

const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID'];

export interface PayrollFormDialogData {
  payroll: Payroll | null;
  employeeOptions: EmployeeOption[];
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    Modal,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-payroll-form-dialog',
  styleUrl: './payroll-form-dialog.scss',
  templateUrl: './payroll-form-dialog.html',
})
export class PayrollFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly payrollApi = inject(PayrollApi);
  private readonly dialogRef = inject(MatDialogRef<PayrollFormDialog>);
  protected readonly data = inject<PayrollFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.payroll;
  protected readonly paymentStatuses = PAYMENT_STATUSES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    employeeId: this.fb.control<string | null>(this.data.payroll?.employee.id ?? null, Validators.required),
    month: this.fb.control<Date | null>(
      this.data.payroll ? new Date(this.data.payroll.month) : null,
      Validators.required,
    ),
    basicSalary: this.fb.nonNullable.control(
      this.data.payroll ? Number(this.data.payroll.basicSalary) : 0,
      [Validators.required, Validators.min(0)],
    ),
    allowances: this.fb.nonNullable.control(this.data.payroll ? Number(this.data.payroll.allowances) : 0, Validators.min(0)),
    bonuses: this.fb.nonNullable.control(this.data.payroll ? Number(this.data.payroll.bonuses) : 0, Validators.min(0)),
    deductions: this.fb.nonNullable.control(this.data.payroll ? Number(this.data.payroll.deductions) : 0, Validators.min(0)),
    tax: this.fb.nonNullable.control(this.data.payroll ? Number(this.data.payroll.tax) : 0, Validators.min(0)),
    paymentStatus: this.fb.nonNullable.control<PaymentStatus>(this.data.payroll?.paymentStatus ?? 'PENDING', Validators.required),
  });

  constructor() {
    if (this.isEditMode) {
      this.form.controls.employeeId.disable();
      this.form.controls.month.disable();
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();

    const request$ =
      this.isEditMode && this.data.payroll
        ? this.payrollApi.update(this.data.payroll.id, {
            basicSalary: raw.basicSalary,
            allowances: raw.allowances,
            bonuses: raw.bonuses,
            deductions: raw.deductions,
            tax: raw.tax,
            paymentStatus: raw.paymentStatus,
          })
        : this.payrollApi.create({
            employeeId: raw.employeeId!,
            month: raw.month!.toISOString(),
            basicSalary: raw.basicSalary,
            allowances: raw.allowances,
            bonuses: raw.bonuses,
            deductions: raw.deductions,
            tax: raw.tax,
            paymentStatus: raw.paymentStatus,
          });

    request$.subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.dialogRef.close(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this payroll record.'));
      },
    });
  }
}
