import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EmployeeDashboard } from './employee-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DashboardApi } from '../../../core/dashboard/dashboard-api';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { User } from '../../../core/models/user.model';

const testUser: User = {
  id: '1',
  email: 'employee1@worksphere.local',
  firstName: 'Sofia',
  lastName: 'Costa',
  role: 'EMPLOYEE',
  isActive: true,
  createdAt: new Date().toISOString(),
};

function configure(overrides: { leaveSummary?: () => unknown; announcements?: () => unknown } = {}) {
  const dashboardApiStub = {
    leaveSummary: vi.fn(
      overrides.leaveSummary ??
        (() => of({ data: { byStatus: { PENDING: 1, APPROVED: 2, REJECTED: 0 }, byType: { ANNUAL: 2, SICK: 1, CASUAL: 0, EMERGENCY: 0, UNPAID: 0 } } })),
    ),
  };
  const announcementApiStub = {
    list: vi.fn(overrides.announcements ?? (() => of({ data: [], page: 1, pageSize: 3, total: 0 }))),
  };

  TestBed.configureTestingModule({
    imports: [EmployeeDashboard],
    providers: [
      provideRouter([]),
      { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      { provide: DashboardApi, useValue: dashboardApiStub },
      { provide: AnnouncementApi, useValue: announcementApiStub },
    ],
  });

  const fixture = TestBed.createComponent(EmployeeDashboard);
  return { fixture, component: fixture.componentInstance, dashboardApiStub, announcementApiStub };
}

describe('EmployeeDashboard', () => {
  let fixture: ComponentFixture<EmployeeDashboard>;

  it('loads own leave summary and announcements in parallel', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.dashboardApiStub.leaveSummary).toHaveBeenCalled();
    expect(setup.announcementApiStub.list).toHaveBeenCalledWith({ page: 1, pageSize: 3 });
    expect(setup.component['loading']()).toBe(false);
  });

  it('computes pending and approved leave counts for the stat cards', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['leavePending']()).toBe(1);
    expect(setup.component['leaveApproved']()).toBe(2);
  });

  it('sets an error when both widgets fail', () => {
    const setup = configure({
      leaveSummary: () => throwError(() => ({ status: 500 })),
      announcements: () => throwError(() => ({ status: 500 })),
    });
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['quickLinks'].some((link) => link.route === '/employee/dashboard')).toBe(false);
    expect(setup.component['quickLinks'].length).toBeGreaterThan(0);
  });
});
