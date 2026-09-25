import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { JobList } from './job-list';
import { JobApi } from '../../../core/recruitment/job-api';
import { DepartmentApi } from '../../../core/departments/department-api';

const job = {
  id: 'job-1',
  title: 'Senior Backend Engineer',
  department: { id: 'dept-1', name: 'Engineering' },
  description: 'Own the platform.',
  requirements: '5+ years.',
  location: 'Remote',
  employmentType: 'FULL_TIME',
  salaryRangeMin: null,
  salaryRangeMax: null,
  status: 'OPEN',
  applicationCount: 2,
  createdAt: new Date().toISOString(),
};

function configure(listImpl: () => unknown) {
  const jobApiStub = { list: vi.fn(listImpl), delete: vi.fn().mockReturnValue(of(undefined)) };
  const departmentApiStub = { list: vi.fn().mockReturnValue(of({ data: [] })) };
  const routerStub = { navigate: vi.fn() };

  TestBed.configureTestingModule({
    imports: [JobList],
    providers: [
      { provide: JobApi, useValue: jobApiStub },
      { provide: DepartmentApi, useValue: departmentApiStub },
      { provide: Router, useValue: routerStub },
    ],
  });

  const fixture = TestBed.createComponent(JobList);
  return { fixture, component: fixture.componentInstance, jobApiStub, routerStub };
}

describe('JobList', () => {
  let fixture: ComponentFixture<JobList>;

  it('loads jobs and departments in parallel on success', () => {
    const setup = configure(() => of({ data: [job], page: 1, pageSize: 50, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['jobs']()).toEqual([job]);
    expect(setup.component['loading']()).toBe(false);
  });

  it('sets an error message on failure', () => {
    const setup = configure(() => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('navigates to the applications view with the job id filter', () => {
    const setup = configure(() => of({ data: [job], page: 1, pageSize: 50, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['viewApplicants'](job as never);

    expect(setup.routerStub.navigate).toHaveBeenCalledWith(['/hr/recruitment/applications'], {
      queryParams: { jobId: 'job-1' },
    });
  });

  it('reloads the list after deleting a job', () => {
    const setup = configure(() => of({ data: [job], page: 1, pageSize: 50, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.jobApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['deleteJob'](job as never, new Event('click'));

    expect(setup.jobApiStub.list).toHaveBeenCalled();
  });
});
