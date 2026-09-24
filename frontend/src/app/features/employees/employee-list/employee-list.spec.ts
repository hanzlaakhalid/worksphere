import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { EmployeeList } from './employee-list';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { DepartmentApi } from '../../../core/departments/department-api';
import { Employee } from '../../../core/models/employee.model';

const employee: Employee = {
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
  department: { id: 'dept-1', name: 'Engineering' },
  position: 'Senior Software Engineer',
  manager: null,
  joiningDate: null,
  employmentType: 'FULL_TIME',
  salary: null,
  status: 'ACTIVE',
  profilePictureUrl: null,
  createdAt: new Date().toISOString(),
};

describe('EmployeeList', () => {
  let component: EmployeeList;
  let fixture: ComponentFixture<EmployeeList>;
  let employeeApiStub: { list: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let departmentApiStub: { list: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  function configure(listImpl: () => unknown) {
    employeeApiStub = {
      list: vi.fn(listImpl),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    departmentApiStub = { list: vi.fn().mockReturnValue(of({ data: [] })) };
    routerStub = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [EmployeeList],
      providers: [
        { provide: EmployeeApi, useValue: employeeApiStub },
        { provide: DepartmentApi, useValue: departmentApiStub },
        { provide: Router, useValue: routerStub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { basePath: '/admin/employees', canManage: true } } },
        },
      ],
    });

    fixture = TestBed.createComponent(EmployeeList);
    component = fixture.componentInstance;
  }

  it('loads and displays employees on success', () => {
    configure(() => of({ data: [employee], page: 1, pageSize: 20, total: 1 }));
    fixture.detectChanges();

    expect(component['loading']()).toBe(false);
    expect(component['employees']()).toEqual([employee]);
    expect(component['total']()).toBe(1);
    expect(component['error']()).toBeNull();
  });

  it('sets an error message and clears the list on API failure', () => {
    configure(() => throwError(() => ({ status: 500 })));
    fixture.detectChanges();

    expect(component['loading']()).toBe(false);
    expect(component['employees']()).toEqual([]);
    expect(component['error']()).toBeTruthy();
  });

  it('re-fetches with page 1 when the search term changes', () => {
    configure(() => of({ data: [], page: 1, pageSize: 20, total: 0 }));
    fixture.detectChanges();
    employeeApiStub.list.mockClear();

    component['onSearchChange']('ava');
    fixture.detectChanges();

    expect(employeeApiStub.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'ava', page: 1 }),
    );
  });

  it('navigates to the base path detail route when a row is clicked', () => {
    configure(() => of({ data: [employee], page: 1, pageSize: 20, total: 1 }));
    fixture.detectChanges();

    component['viewEmployee'](employee);

    expect(routerStub.navigate).toHaveBeenCalledWith(['/admin/employees', 'emp-1']);
  });

  it('reloads the list after a confirmed delete', () => {
    configure(() => of({ data: [employee], page: 1, pageSize: 20, total: 1 }));
    fixture.detectChanges();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);
    employeeApiStub.list.mockClear();

    component['deleteEmployee'](employee, new Event('click'));
    fixture.detectChanges();

    expect(employeeApiStub.delete).toHaveBeenCalledWith('emp-1');
    expect(employeeApiStub.list).toHaveBeenCalled();
  });
});
