import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PayrollFormDialog } from './payroll-form-dialog';
import { PayrollApi } from '../../../core/payroll/payroll-api';

const payroll = {
  id: 'payroll-1',
  employee: { id: 'emp-1', employeeCode: 'EMP-0001', firstName: 'Jane', lastName: 'Doe', department: 'Engineering' },
  month: '2026-09-01',
  basicSalary: '5000.00',
  allowances: '200.00',
  bonuses: '0.00',
  deductions: '0.00',
  tax: '500.00',
  netSalary: '4700.00',
  paymentStatus: 'PENDING',
  createdAt: new Date().toISOString(),
};

function configure(existing: unknown) {
  const payrollApiStub = {
    create: vi.fn().mockReturnValue(of({ data: { id: 'new-payroll' } })),
    update: vi.fn().mockReturnValue(of({ data: { id: 'payroll-1' } })),
  };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [PayrollFormDialog],
    providers: [
      { provide: PayrollApi, useValue: payrollApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { payroll: existing, employeeOptions: [{ id: 'emp-1', name: 'Jane Doe' }] } },
    ],
  });

  const fixture = TestBed.createComponent(PayrollFormDialog);
  return { fixture, component: fixture.componentInstance, payrollApiStub, dialogRefStub };
}

describe('PayrollFormDialog', () => {
  let fixture: ComponentFixture<PayrollFormDialog>;

  it('starts in create mode with an empty form when no record is given', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['isEditMode']).toBe(false);
    expect(setup.component['form'].controls.basicSalary.value).toBe(0);
  });

  it('does not submit an invalid form', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.payrollApiStub.create).not.toHaveBeenCalled();
  });

  it('creates a payroll record and closes the dialog with the result', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({ employeeId: 'emp-1', month: new Date('2026-09-01'), basicSalary: 5000 });
    setup.component['submit']();

    expect(setup.payrollApiStub.create).toHaveBeenCalled();
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'new-payroll' });
  });

  it('disables employee and month in edit mode and updates without them', () => {
    const setup = configure(payroll);
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['form'].controls.employeeId.disabled).toBe(true);
    expect(setup.component['form'].controls.month.disabled).toBe(true);

    setup.component['submit']();

    expect(setup.payrollApiStub.update).toHaveBeenCalledWith(
      'payroll-1',
      expect.objectContaining({ basicSalary: 5000, paymentStatus: 'PENDING' }),
    );
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'payroll-1' });
  });
});
