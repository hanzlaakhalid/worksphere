import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PayrollList } from './payroll-list';
import { PayrollApi } from '../../../core/payroll/payroll-api';
import { EmployeeApi } from '../../../core/employees/employee-api';

const record = {
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

function configure(mode: 'self' | 'manage', listImpl: () => unknown) {
  const payrollApiStub = {
    list: vi.fn(listImpl),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };
  const employeeApiStub = { options: vi.fn().mockReturnValue(of({ data: [] })) };

  TestBed.configureTestingModule({
    imports: [PayrollList],
    providers: [
      { provide: PayrollApi, useValue: payrollApiStub },
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode } } } },
    ],
  });

  const fixture = TestBed.createComponent(PayrollList);
  return { fixture, component: fixture.componentInstance, payrollApiStub, employeeApiStub };
}

describe('PayrollList', () => {
  let fixture: ComponentFixture<PayrollList>;

  it('loads own payslips in self mode without loading employee options', () => {
    const setup = configure('self', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['records']()).toEqual([record]);
    expect(setup.employeeApiStub.options).not.toHaveBeenCalled();
  });

  it('loads employee options in manage mode', () => {
    const setup = configure('manage', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.employeeApiStub.options).toHaveBeenCalled();
  });

  it('sets an error message on failure', () => {
    const setup = configure('manage', () => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('opens the add dialog and reloads on a result', () => {
    const setup = configure('manage', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.payrollApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(record) } as never);

    setup.component['openAddDialog']();
    fixture.detectChanges();

    expect(setup.payrollApiStub.list).toHaveBeenCalled();
  });

  it('deletes a record after confirmation and reloads', () => {
    const setup = configure('manage', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.payrollApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['deleteRecord'](record as never, new Event('click'));
    fixture.detectChanges();

    expect(setup.payrollApiStub.delete).toHaveBeenCalledWith('payroll-1');
    expect(setup.payrollApiStub.list).toHaveBeenCalled();
  });

  it('does not delete when the confirm dialog is dismissed', () => {
    const setup = configure('manage', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(false) } as never);

    setup.component['deleteRecord'](record as never, new Event('click'));

    expect(setup.payrollApiStub.delete).not.toHaveBeenCalled();
  });
});
