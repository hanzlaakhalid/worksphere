import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayout } from './main-layout';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { User } from '../../core/models/user.model';

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
    ]);
  });

  it('computes initials from the current user', () => {
    expect(component['userInitials']()).toBe('HR');
  });
});
