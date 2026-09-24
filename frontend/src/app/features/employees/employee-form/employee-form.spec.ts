import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { EmployeeForm } from './employee-form';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { DepartmentApi } from '../../../core/departments/department-api';

function configureTestBed(employeeId: string | null) {
  const employeeApiStub = {
    options: vi.fn().mockReturnValue(of({ data: [] })),
    getById: vi.fn().mockReturnValue(
      of({
        data: {
          id: 'emp-1',
          firstName: 'Ava',
          lastName: 'Johansson',
          email: 'ava@worksphere.local',
          phone: null,
          dateOfBirth: null,
          gender: null,
          address: null,
          department: null,
          position: 'Engineer',
          manager: null,
          joiningDate: null,
          employmentType: 'FULL_TIME',
          salary: '100000',
          status: 'ACTIVE',
          profilePictureUrl: null,
        },
      }),
    ),
    create: vi.fn().mockReturnValue(of({ data: { id: 'new-emp' } })),
    update: vi.fn().mockReturnValue(of({ data: { id: employeeId } })),
  };
  const departmentApiStub = { list: vi.fn().mockReturnValue(of({ data: [] })) };
  const routerStub = { navigate: vi.fn() };

  TestBed.configureTestingModule({
    imports: [EmployeeForm],
    providers: [
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: DepartmentApi, useValue: departmentApiStub },
      { provide: Router, useValue: routerStub },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: { basePath: '/admin/employees' },
            paramMap: convertToParamMap(employeeId ? { id: employeeId } : {}),
          },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(EmployeeForm);
  return { fixture, component: fixture.componentInstance, employeeApiStub, routerStub };
}

describe('EmployeeForm', () => {
  let fixture: ComponentFixture<EmployeeForm>;

  it('is in create mode with an enabled email field when there is no id', () => {
    ({ fixture } = configureTestBed(null));
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['isEditMode']).toBe(false);
    expect(component['form'].controls.email.disabled).toBe(false);
  });

  it('loads the employee and disables email in edit mode', () => {
    const setup = configureTestBed('emp-1');
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.employeeApiStub.getById).toHaveBeenCalledWith('emp-1');
    expect(setup.component['form'].controls.email.disabled).toBe(true);
    expect(setup.component['form'].controls.firstName.value).toBe('Ava');
    expect(setup.component['loading']()).toBe(false);
  });

  it('does not submit an invalid form', () => {
    const setup = configureTestBed(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.employeeApiStub.create).not.toHaveBeenCalled();
  });

  it('requires salary unless the employment type is INTERN', () => {
    const setup = configureTestBed(null);
    fixture = setup.fixture;
    fixture.detectChanges();
    const form = setup.component['form'];

    form.patchValue({ employmentType: 'FULL_TIME', salary: null });
    expect(form.controls.salary.hasError('salaryRequired')).toBe(true);

    form.patchValue({ employmentType: 'INTERN', salary: null });
    expect(form.controls.salary.hasError('salaryRequired')).toBe(false);
  });

  it('calls employeeApi.create and navigates on successful submit', () => {
    const setup = configureTestBed(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      firstName: 'Nina',
      lastName: 'Petrov',
      email: 'nina@worksphere.local',
      employmentType: 'INTERN',
    });
    setup.component['submit']();

    expect(setup.employeeApiStub.create).toHaveBeenCalled();
    expect(setup.routerStub.navigate).toHaveBeenCalledWith(['/admin/employees', 'new-emp']);
  });
});
