import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HrDashboard } from './hr-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DashboardApi } from '../../../core/dashboard/dashboard-api';
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { User } from '../../../core/models/user.model';

const testUser: User = {
  id: '1',
  email: 'hr1@worksphere.local',
  firstName: 'Hana',
  lastName: 'Reyes',
  role: 'HR_MANAGER',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const employeeSummary = {
  total: 15,
  byStatus: { ACTIVE: 13, INACTIVE: 1, ON_LEAVE: 1, TERMINATED: 0 },
  byDepartment: [{ department: 'Engineering', count: 4 }],
};

function configure(overrides: { dashboardApi?: Record<string, unknown> } = {}) {
  const dashboardApiStub = {
    employeeSummary: vi.fn().mockReturnValue(of({ data: employeeSummary })),
    employeeGrowth: vi.fn().mockReturnValue(of({ data: { labels: ['Sep 2026'], counts: [1] } })),
    attendanceTrend: vi.fn().mockReturnValue(of({ data: { labels: ['Sep 25'], presentPercent: [90] } })),
    leaveSummary: vi.fn().mockReturnValue(
      of({ data: { byStatus: { PENDING: 2, APPROVED: 3, REJECTED: 1 }, byType: { ANNUAL: 3, SICK: 1, CASUAL: 0, EMERGENCY: 0, UNPAID: 2 } } }),
    ),
    payrollSummary: vi.fn().mockReturnValue(of({ data: { currentMonthTotal: '91587.49', byDepartment: [{ department: 'Engineering', total: '33008.34' }] } })),
    ...overrides.dashboardApi,
  };
  const applicationApiStub = {
    stats: vi.fn().mockReturnValue(of({ data: { openJobs: 3, totalApplicants: 8, byStatus: {} } })),
  };
  const announcementApiStub = {
    list: vi.fn().mockReturnValue(of({ data: [{ id: 'a1', title: 'Update', publishedAt: new Date().toISOString() }], page: 1, pageSize: 3, total: 1 })),
  };

  TestBed.configureTestingModule({
    imports: [HrDashboard],
    providers: [
      provideRouter([]),
      { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      { provide: DashboardApi, useValue: dashboardApiStub },
      { provide: ApplicationApi, useValue: applicationApiStub },
      { provide: AnnouncementApi, useValue: announcementApiStub },
    ],
  });

  const fixture = TestBed.createComponent(HrDashboard);
  return { fixture, component: fixture.componentInstance, dashboardApiStub, applicationApiStub, announcementApiStub };
}

describe('HrDashboard', () => {
  let fixture: ComponentFixture<HrDashboard>;

  it('loads all widgets in parallel via forkJoin', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.dashboardApiStub.employeeSummary).toHaveBeenCalled();
    expect(setup.dashboardApiStub.employeeGrowth).toHaveBeenCalledWith(12);
    expect(setup.dashboardApiStub.attendanceTrend).toHaveBeenCalledWith(14);
    expect(setup.dashboardApiStub.leaveSummary).toHaveBeenCalled();
    expect(setup.applicationApiStub.stats).toHaveBeenCalled();
    expect(setup.dashboardApiStub.payrollSummary).toHaveBeenCalled();
    expect(setup.announcementApiStub.list).toHaveBeenCalledWith({ page: 1, pageSize: 3 });
    expect(setup.component['loading']()).toBe(false);
  });

  it('builds the employee status chart from the summary', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    const chart = setup.component['employeeStatusChart']();
    expect(chart?.labels).toEqual(['ACTIVE', 'INACTIVE', 'ON LEAVE']);
    expect(chart?.datasets[0].data).toEqual([13, 1, 1]);
  });

  it('computes pending leave count for the stat card', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['leavePending']()).toBe(2);
  });

  it('excludes the dashboard route from its own quick links', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['quickLinks'].some((link) => link.route === '/hr/dashboard')).toBe(false);
    expect(setup.component['quickLinks'].length).toBeGreaterThan(0);
  });

  it('falls back to a full error state only when every widget fails', () => {
    const dashboardApiStub = {
      employeeSummary: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
      employeeGrowth: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
      attendanceTrend: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
      leaveSummary: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
      payrollSummary: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
    };
    const setup = configure({ dashboardApi: dashboardApiStub });
    setup.applicationApiStub.stats.mockReturnValue(throwError(() => ({ status: 500 })));
    setup.announcementApiStub.list.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });
});
