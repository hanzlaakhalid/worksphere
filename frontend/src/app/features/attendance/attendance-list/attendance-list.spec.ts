import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AttendanceList } from './attendance-list';
import { AttendanceApi } from '../../../core/attendance/attendance-api';
import { DepartmentApi } from '../../../core/departments/department-api';

const record = {
  id: 'att-1',
  employee: { id: 'emp-1', employeeCode: 'EMP-0001', firstName: 'Sofia', lastName: 'Costa', department: 'Engineering' },
  date: new Date().toISOString(),
  checkIn: new Date().toISOString(),
  checkOut: new Date().toISOString(),
  workingHours: '8.75',
  status: 'PRESENT',
};

function configure(scope: 'self' | 'scoped', listImpl: () => unknown) {
  const attendanceApiStub = {
    list: vi.fn(listImpl),
    statsToday: vi.fn().mockReturnValue(of({ data: { present: 10, absent: 1, late: 2, halfDay: 0, onLeave: 1 } })),
  };
  const departmentApiStub = { list: vi.fn().mockReturnValue(of({ data: [] })) };

  TestBed.configureTestingModule({
    imports: [AttendanceList],
    providers: [
      { provide: AttendanceApi, useValue: attendanceApiStub },
      { provide: DepartmentApi, useValue: departmentApiStub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { scope } } } },
    ],
  });

  const fixture = TestBed.createComponent(AttendanceList);
  return { fixture, component: fixture.componentInstance, attendanceApiStub, departmentApiStub };
}

describe('AttendanceList', () => {
  let fixture: ComponentFixture<AttendanceList>;

  it('loads records and stats for a scoped (manager/hr) view', () => {
    const setup = configure('scoped', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['records']()).toEqual([record]);
    expect(setup.component['stats']()).toEqual({ present: 10, absent: 1, late: 2, halfDay: 0, onLeave: 1 });
    expect(setup.departmentApiStub.list).toHaveBeenCalled();
  });

  it('skips stats and department lookups for a self-scoped view', () => {
    const setup = configure('self', () => of({ data: [record], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.attendanceApiStub.statsToday).not.toHaveBeenCalled();
    expect(setup.departmentApiStub.list).not.toHaveBeenCalled();
    expect(setup.component['stats']()).toBeNull();
  });

  it('sets an error message on API failure', () => {
    const setup = configure('scoped', () => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
    expect(setup.component['loading']()).toBe(false);
  });

  it('resets to page 1 when a filter changes', () => {
    const setup = configure('scoped', () => of({ data: [], page: 1, pageSize: 20, total: 0 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.component['page'].set(3);

    setup.component['onStatusFilterChange']('LATE');

    expect(setup.component['page']()).toBe(1);
    expect(setup.component['statusFilter']()).toBe('LATE');
  });
});
