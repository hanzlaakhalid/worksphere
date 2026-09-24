import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { DepartmentApi } from '../../../core/departments/department-api';
import { EmployeeOption, EmploymentType, EmployeeStatus, Gender } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { FileUpload } from '../../../shared/ui/file-upload/file-upload';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const STATUSES: EmployeeStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
const GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

/** Salary is optional for interns, required for every other employment type. */
function salaryRequiredUnlessInternValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const employmentType = group.get('employmentType')?.value as EmploymentType | undefined;
    const salary = group.get('salary');
    if (!salary) return null;

    if (employmentType !== 'INTERN' && (salary.value === null || salary.value === undefined || salary.value === '')) {
      salary.setErrors({ ...salary.errors, salaryRequired: true });
    } else if (salary.errors) {
      const { salaryRequired: _removed, ...rest } = salary.errors;
      salary.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
    return null;
  };
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FileUpload,
    LoadingSpinner,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-employee-form',
  styleUrl: './employee-form.scss',
  templateUrl: './employee-form.html',
})
export class EmployeeForm {
  private readonly fb = inject(FormBuilder);
  private readonly employeeApi = inject(EmployeeApi);
  private readonly departmentApi = inject(DepartmentApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly basePath = this.route.snapshot.data['basePath'] as string;
  protected readonly employeeId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = !!this.employeeId;

  protected readonly employmentTypes = EMPLOYMENT_TYPES;
  protected readonly statuses = STATUSES;
  protected readonly genders = GENDERS;

  protected readonly loading = signal(this.isEditMode);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly departments = signal<Department[]>([]);
  protected readonly managers = signal<EmployeeOption[]>([]);

  protected readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
      dateOfBirth: this.fb.control<Date | null>(null),
      gender: this.fb.control<Gender | null>(null),
      address: [''],
      departmentId: this.fb.control<string | null>(null),
      position: [''],
      managerId: this.fb.control<string | null>(null),
      joiningDate: this.fb.control<Date | null>(null),
      employmentType: this.fb.nonNullable.control<EmploymentType>('FULL_TIME', Validators.required),
      salary: this.fb.control<number | null>(null),
      status: this.fb.nonNullable.control<EmployeeStatus>('ACTIVE', Validators.required),
      profilePictureUrl: this.fb.control<string | null>(null),
    },
    { validators: salaryRequiredUnlessInternValidator() },
  );

  constructor() {
    this.departmentApi.list().subscribe({ next: (res) => this.departments.set(res.data) });
    this.employeeApi.options().subscribe({
      next: (res) => this.managers.set(res.data.filter((m) => m.id !== this.employeeId)),
    });

    if (this.isEditMode && this.employeeId) {
      this.form.controls.email.disable();
      this.employeeApi.getById(this.employeeId).subscribe({
        next: ({ data }) => {
          this.form.patchValue({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone ?? '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender,
            address: data.address ?? '',
            departmentId: data.department?.id ?? null,
            position: data.position ?? '',
            managerId: data.manager?.id ?? null,
            joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
            employmentType: data.employmentType,
            salary: data.salary ? Number(data.salary) : null,
            status: data.status,
            profilePictureUrl: data.profilePictureUrl,
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(extractErrorMessage(err, 'Unable to load this employee.'));
        },
      });
    }
  }

  protected onPhotoUploaded(url: string): void {
    this.form.controls.profilePictureUrl.setValue(url);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const value = {
      ...raw,
      dateOfBirth: raw.dateOfBirth ? raw.dateOfBirth.toISOString() : null,
      joiningDate: raw.joiningDate ? raw.joiningDate.toISOString() : null,
    };

    const request$ =
      this.isEditMode && this.employeeId
        ? this.employeeApi.update(this.employeeId, value)
        : this.employeeApi.create(value);

    request$.subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.router.navigate([this.basePath, data.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this employee.'));
      },
    });
  }

  protected cancel(): void {
    this.router.navigate([this.basePath]);
  }
}
