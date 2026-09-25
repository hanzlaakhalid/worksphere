import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PerformanceList } from './performance-list';
import { PerformanceApi } from '../../../core/performance/performance-api';
import { EmployeeApi } from '../../../core/employees/employee-api';

const review = {
  id: 'rev-1',
  employee: { id: 'emp-1', employeeCode: 'EMP-0006', firstName: 'Sofia', lastName: 'Costa' },
  reviewer: { id: 'emp-2', employeeCode: 'EMP-0002', firstName: 'Maria', lastName: 'Novak' },
  reviewPeriod: 'Q1 2026',
  overallRating: 'EXCEEDS_EXPECTATIONS',
  goals: 'Ship it',
  achievements: 'Shipped it',
  strengths: 'Great',
  areasForImprovement: 'Delegate',
  managerComments: 'Nice work',
  createdAt: new Date().toISOString(),
};

function configure(mode: 'self' | 'team', listImpl: () => unknown) {
  const performanceApiStub = { list: vi.fn(listImpl) };
  const employeeApiStub = { list: vi.fn().mockReturnValue(of({ data: [], page: 1, pageSize: 100, total: 0 })) };

  TestBed.configureTestingModule({
    imports: [PerformanceList],
    providers: [
      { provide: PerformanceApi, useValue: performanceApiStub },
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode } } } },
    ],
  });

  const fixture = TestBed.createComponent(PerformanceList);
  return { fixture, component: fixture.componentInstance, performanceApiStub, employeeApiStub };
}

describe('PerformanceList', () => {
  let fixture: ComponentFixture<PerformanceList>;

  it('loads reviews on success', () => {
    const setup = configure('self', () => of({ data: [review], page: 1, pageSize: 50, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['reviews']()).toEqual([review]);
    expect(setup.component['loading']()).toBe(false);
  });

  it('sets an error message on failure', () => {
    const setup = configure('self', () => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('toggles the expanded row id', () => {
    const setup = configure('self', () => of({ data: [review], page: 1, pageSize: 50, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['toggle']('rev-1');
    expect(setup.component['expandedId']()).toBe('rev-1');
    setup.component['toggle']('rev-1');
    expect(setup.component['expandedId']()).toBeNull();
  });

  it('opens the new-review dialog with the manager team as options', () => {
    const setup = configure('team', () => of({ data: [], page: 1, pageSize: 50, total: 0 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.employeeApiStub.list.mockReturnValue(
      of({ data: [{ id: 'emp-1', firstName: 'Sofia', lastName: 'Costa' }], page: 1, pageSize: 100, total: 1 }),
    );
    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(review) } as never);

    setup.component['openNewReviewDialog']();

    expect(setup.component['reviews']()).toEqual([review]);
  });
});
