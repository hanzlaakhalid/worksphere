import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ManagerDashboard } from './manager-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DashboardApi } from '../../../core/dashboard/dashboard-api';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { User } from '../../../core/models/user.model';

const testUser: User = {
  id: '1',
  email: 'manager1@worksphere.local',
  firstName: 'Maria',
  lastName: 'Novak',
  role: 'MANAGER',
  isActive: true,
  createdAt: new Date().toISOString(),
};

function configure(overrides: { employeeSummary?: () => unknown; leaveSummary?: () => unknown } = {}) {
  const dashboardApiStub = {
    employeeSummary: vi.fn(
      overrides.employeeSummary ??
        (() => of({ data: { total: 4, byStatus: { ACTIVE: 4, INACTIVE: 0, ON_LEAVE: 0, TERMINATED: 0 }, byDepartment: [] } })),
    ),
    attendanceTrend: vi.fn().mockReturnValue(of({ data: { labels: ['Sep 25'], presentPercent: [90] } })),
    leaveSummary: vi.fn(
      overrides.leaveSummary ??
        (() => of({ data: { byStatus: { PENDING: 1, APPROVED: 2, REJECTED: 0 }, byType: { ANNUAL: 2, SICK: 1, CASUAL: 0, EMERGENCY: 0, UNPAID: 0 } } })),
    ),
  };
  const announcementApiStub = {
    list: vi.fn().mockReturnValue(of({ data: [], page: 1, pageSize: 3, total: 0 })),
  };

  TestBed.configureTestingModule({
    imports: [ManagerDashboard],
    providers: [
      provideRouter([]),
      { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      { provide: DashboardApi, useValue: dashboardApiStub },
      { provide: AnnouncementApi, useValue: announcementApiStub },
    ],
  });

  const fixture = TestBed.createComponent(ManagerDashboard);
  return { fixture, component: fixture.componentInstance, dashboardApiStub, announcementApiStub };
}

describe('ManagerDashboard', () => {
  let fixture: ComponentFixture<ManagerDashboard>;

  it('loads team summary, attendance trend, leave summary, and announcements in parallel', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.dashboardApiStub.employeeSummary).toHaveBeenCalled();
    expect(setup.dashboardApiStub.attendanceTrend).toHaveBeenCalledWith(14);
    expect(setup.dashboardApiStub.leaveSummary).toHaveBeenCalled();
    expect(setup.announcementApiStub.list).toHaveBeenCalledWith({ page: 1, pageSize: 3 });
    expect(setup.component['loading']()).toBe(false);
  });

  it('computes team size and pending leave for the stat cards', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['teamSize']()).toBe(4);
    expect(setup.component['leavePending']()).toBe(1);
  });

  it('sets an error when every core widget fails', () => {
    const setup = configure({
      employeeSummary: () => throwError(() => ({ status: 500 })),
      leaveSummary: () => throwError(() => ({ status: 500 })),
    });
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['quickLinks'].some((link) => link.route === '/manager/dashboard')).toBe(false);
    expect(setup.component['quickLinks'].length).toBeGreaterThan(0);
  });
});
