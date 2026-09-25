import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminDashboard } from './admin-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DashboardApi } from '../../../core/dashboard/dashboard-api';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { User } from '../../../core/models/user.model';

const testUser: User = {
  id: '1',
  email: 'admin@worksphere.local',
  firstName: 'Alex',
  lastName: 'Admin',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const employeeSummary = {
  total: 15,
  byStatus: { ACTIVE: 13, INACTIVE: 1, ON_LEAVE: 1, TERMINATED: 0 },
  byDepartment: [{ department: 'Engineering', count: 4 }],
};

function configure(employeeSummaryImpl?: () => unknown) {
  const dashboardApiStub = {
    employeeSummary: vi.fn(employeeSummaryImpl ?? (() => of({ data: employeeSummary }))),
    employeeGrowth: vi.fn().mockReturnValue(of({ data: { labels: ['Sep 2026'], counts: [1] } })),
  };
  const announcementApiStub = {
    list: vi.fn().mockReturnValue(of({ data: [{ id: 'a1', title: 'Update', publishedAt: new Date().toISOString() }], page: 1, pageSize: 3, total: 1 })),
  };

  TestBed.configureTestingModule({
    imports: [AdminDashboard],
    providers: [
      provideRouter([]),
      { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      { provide: DashboardApi, useValue: dashboardApiStub },
      { provide: AnnouncementApi, useValue: announcementApiStub },
    ],
  });

  const fixture = TestBed.createComponent(AdminDashboard);
  return { fixture, component: fixture.componentInstance, dashboardApiStub, announcementApiStub };
}

describe('AdminDashboard', () => {
  let fixture: ComponentFixture<AdminDashboard>;

  it('loads employee summary, growth, and announcements in parallel', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.dashboardApiStub.employeeSummary).toHaveBeenCalled();
    expect(setup.dashboardApiStub.employeeGrowth).toHaveBeenCalledWith(12);
    expect(setup.announcementApiStub.list).toHaveBeenCalledWith({ page: 1, pageSize: 3 });
    expect(setup.component['loading']()).toBe(false);
  });

  it('builds the employee status chart from the summary', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    const chart = setup.component['employeeStatusChart']();
    expect(chart?.labels).toEqual(['ACTIVE', 'INACTIVE', 'ON LEAVE']);
  });

  it('sets an error when the core widget fails', () => {
    const setup = configure(() => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['quickLinks'].some((link) => link.route === '/admin/dashboard')).toBe(false);
    expect(setup.component['quickLinks'].length).toBeGreaterThan(0);
  });
});
