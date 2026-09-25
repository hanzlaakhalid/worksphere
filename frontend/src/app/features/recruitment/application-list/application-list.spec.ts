import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ApplicationList } from './application-list';
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { JobApi } from '../../../core/recruitment/job-api';
import { EmployeeApi } from '../../../core/employees/employee-api';

const application = {
  id: 'app-1',
  status: 'APPLIED',
  appliedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  applicant: { id: 'applicant-1', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: null, resumeUrl: null },
  job: { id: 'job-1', title: 'Senior Backend Engineer' },
  interviews: [],
};

function configure(listImpl: () => unknown, queryParams: Record<string, string> = {}) {
  const applicationApiStub = {
    list: vi.fn(listImpl),
    updateStatus: vi.fn().mockReturnValue(of({ data: application })),
  };
  const jobApiStub = { options: vi.fn().mockReturnValue(of({ data: [] })) };
  const employeeApiStub = { list: vi.fn().mockReturnValue(of({ data: [] })) };
  const activatedRouteStub = {
    snapshot: { queryParamMap: convertToParamMap(queryParams) },
  };

  TestBed.configureTestingModule({
    imports: [ApplicationList],
    providers: [
      { provide: ApplicationApi, useValue: applicationApiStub },
      { provide: JobApi, useValue: jobApiStub },
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: ActivatedRoute, useValue: activatedRouteStub },
    ],
  });

  const fixture = TestBed.createComponent(ApplicationList);
  return { fixture, component: fixture.componentInstance, applicationApiStub, jobApiStub, employeeApiStub };
}

describe('ApplicationList', () => {
  let fixture: ComponentFixture<ApplicationList>;

  it('loads applications on success', () => {
    const setup = configure(() => of({ data: [application], page: 1, pageSize: 100, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['applications']()).toEqual([application]);
    expect(setup.component['loading']()).toBe(false);
  });

  it('sets an error message on failure', () => {
    const setup = configure(() => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('seeds the job filter from the jobId query param', () => {
    const setup = configure(() => of({ data: [], page: 1, pageSize: 100, total: 0 }), { jobId: 'job-1' });
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['jobFilter']()).toBe('job-1');
  });

  it('reloads after a status change', () => {
    const setup = configure(() => of({ data: [application], page: 1, pageSize: 100, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.applicationApiStub.list.mockClear();

    setup.component['changeStatus'](application as never, 'SCREENING');
    fixture.detectChanges();

    expect(setup.applicationApiStub.updateStatus).toHaveBeenCalledWith('app-1', 'SCREENING');
    expect(setup.applicationApiStub.list).toHaveBeenCalled();
  });

  it('opens the log application dialog and reloads on close with a result', () => {
    const setup = configure(() => of({ data: [application], page: 1, pageSize: 100, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.applicationApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['openLogApplicationDialog']();
    fixture.detectChanges();

    expect(setup.applicationApiStub.list).toHaveBeenCalled();
  });

  it('loads employee options and opens the interview dialog', () => {
    const setup = configure(() => of({ data: [application], page: 1, pageSize: 100, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.applicationApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['scheduleInterview'](application as never, new Event('click'));
    fixture.detectChanges();

    expect(setup.employeeApiStub.list).toHaveBeenCalled();
    expect(setup.applicationApiStub.list).toHaveBeenCalled();
  });

  it('toggles the expanded row', () => {
    const setup = configure(() => of({ data: [application], page: 1, pageSize: 100, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['toggle']('app-1');
    expect(setup.component['expandedId']()).toBe('app-1');

    setup.component['toggle']('app-1');
    expect(setup.component['expandedId']()).toBeNull();
  });
});
