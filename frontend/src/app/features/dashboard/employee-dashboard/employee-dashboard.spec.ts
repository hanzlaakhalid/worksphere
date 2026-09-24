import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmployeeDashboard } from './employee-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { User } from '../../../core/models/user.model';

describe('EmployeeDashboard', () => {
  let component: EmployeeDashboard;
  let fixture: ComponentFixture<EmployeeDashboard>;

  const testUser: User = {
    id: '1',
    email: 'employee1@worksphere.local',
    firstName: 'Sofia',
    lastName: 'Costa',
    role: 'EMPLOYEE',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDashboard],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    expect(component['quickLinks'].some((link) => link.route === '/employee/dashboard')).toBe(false);
    expect(component['quickLinks'].length).toBeGreaterThan(0);
  });
});
