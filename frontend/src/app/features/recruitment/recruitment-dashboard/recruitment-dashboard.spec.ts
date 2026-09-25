import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecruitmentDashboard } from './recruitment-dashboard';
import { ApplicationApi } from '../../../core/recruitment/application-api';

const stats = {
  openJobs: 3,
  totalApplicants: 8,
  byStatus: { APPLIED: 2, SCREENING: 1, INTERVIEW: 2, SELECTED: 2, REJECTED: 1 },
};

function configure(statsImpl: () => unknown) {
  const applicationApiStub = { stats: vi.fn(statsImpl) };

  TestBed.configureTestingModule({
    imports: [RecruitmentDashboard],
    providers: [provideRouter([]), { provide: ApplicationApi, useValue: applicationApiStub }],
  });

  const fixture = TestBed.createComponent(RecruitmentDashboard);
  return { fixture, component: fixture.componentInstance };
}

describe('RecruitmentDashboard', () => {
  let fixture: ComponentFixture<RecruitmentDashboard>;

  it('loads recruitment stats on success', () => {
    const setup = configure(() => of({ data: stats }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['stats']()).toEqual(stats);
    expect(setup.component['loading']()).toBe(false);
    expect(setup.component['hasApplications']()).toBe(true);
  });

  it('sets an error message on failure', () => {
    const setup = configure(() => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('reports no applications when every status count is zero', () => {
    const setup = configure(() =>
      of({ data: { openJobs: 1, totalApplicants: 0, byStatus: { APPLIED: 0, SCREENING: 0, INTERVIEW: 0, SELECTED: 0, REJECTED: 0 } } }),
    );
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['hasApplications']()).toBe(false);
  });
});
