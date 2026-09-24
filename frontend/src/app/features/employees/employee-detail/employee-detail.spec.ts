import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { EmployeeDetail } from './employee-detail';
import { EmployeeApi } from '../../../core/employees/employee-api';

const employee = {
  id: 'emp-1',
  employeeCode: 'EMP-0001',
  firstName: 'Ava',
  lastName: 'Johansson',
  email: 'ava@worksphere.local',
  role: 'EMPLOYEE',
  phone: null,
  dateOfBirth: null,
  gender: null,
  address: null,
  department: null,
  position: 'Engineer',
  manager: null,
  joiningDate: null,
  employmentType: 'FULL_TIME',
  salary: null,
  status: 'ACTIVE',
  profilePictureUrl: null,
  createdAt: new Date().toISOString(),
};

function configureTestBed() {
  const employeeApiStub = {
    getById: vi.fn().mockReturnValue(of({ data: employee })),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };
  const routerStub = { navigate: vi.fn() };

  TestBed.configureTestingModule({
    imports: [EmployeeDetail],
    providers: [
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: Router, useValue: routerStub },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { data: { basePath: '/admin/employees', canManage: true }, paramMap: convertToParamMap({ id: 'emp-1' }) },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(EmployeeDetail);
  return { fixture, component: fixture.componentInstance, employeeApiStub, routerStub };
}

describe('EmployeeDetail', () => {
  let fixture: ComponentFixture<EmployeeDetail>;

  it('loads the employee by id from the route', () => {
    const setup = configureTestBed();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.employeeApiStub.getById).toHaveBeenCalledWith('emp-1');
    expect(setup.component['employee']()).toEqual(employee);
    expect(setup.component['loading']()).toBe(false);
  });

  it('sets an error when the employee fails to load', () => {
    TestBed.resetTestingModule();
    const employeeApiStub = { getById: vi.fn().mockReturnValue(throwError(() => ({ status: 404 }))) };
    TestBed.configureTestingModule({
      imports: [EmployeeDetail],
      providers: [
        { provide: EmployeeApi, useValue: employeeApiStub },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { basePath: '/admin/employees' }, paramMap: convertToParamMap({ id: 'missing' }) },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(EmployeeDetail);
    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBeTruthy();
    expect(fixture.componentInstance['employee']()).toBeNull();
  });

  it('navigates to the edit route', () => {
    const setup = configureTestBed();
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['edit']();

    expect(setup.routerStub.navigate).toHaveBeenCalledWith(['/admin/employees', 'emp-1', 'edit']);
  });

  it('deletes and navigates back to the list after confirmation', () => {
    const setup = configureTestBed();
    fixture = setup.fixture;
    fixture.detectChanges();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['remove']();

    expect(setup.employeeApiStub.delete).toHaveBeenCalledWith('emp-1');
    expect(setup.routerStub.navigate).toHaveBeenCalledWith(['/admin/employees']);
  });
});
