import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ManagerDashboard } from './manager-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { User } from '../../../core/models/user.model';

describe('ManagerDashboard', () => {
  let component: ManagerDashboard;
  let fixture: ComponentFixture<ManagerDashboard>;

  const testUser: User = {
    id: '1',
    email: 'manager1@worksphere.local',
    firstName: 'Maria',
    lastName: 'Novak',
    role: 'MANAGER',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerDashboard],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    expect(component['quickLinks'].some((link) => link.route === '/manager/dashboard')).toBe(false);
    expect(component['quickLinks'].length).toBeGreaterThan(0);
  });
});
