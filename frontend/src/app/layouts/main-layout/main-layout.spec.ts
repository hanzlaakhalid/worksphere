import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MainLayout } from './main-layout';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { User } from '../../core/models/user.model';
import { NotificationApi } from '../../core/notifications/notification-api';
import { SearchApi } from '../../core/search/search-api';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  const testUser: User = {
    id: '1',
    email: 'hr1@worksphere.local',
    firstName: 'Hana',
    lastName: 'Reyes',
    role: 'HR_MANAGER',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: {
            currentUser: () => testUser,
            role: () => testUser.role,
            logout: () => undefined,
          },
        },
        { provide: NotificationApi, useValue: { unreadCount: () => of({ data: { count: 0 } }) } },
        { provide: SearchApi, useValue: { search: () => of({ data: { employees: [], departments: [], jobs: [], announcements: [] } }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the nav items for the current role', () => {
    expect(component['navItems']().map((item) => item.label)).toEqual([
      'Dashboard',
      'Employees',
      'Departments',
      'Attendance',
      'Leave Management',
      'Recruitment',
      'Payroll',
      'Documents',
      'Announcements',
    ]);
  });

  it('computes initials from the current user', () => {
    expect(component['userInitials']()).toBe('HR');
  });
});
