import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HrDashboard } from './hr-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { User } from '../../../core/models/user.model';

describe('HrDashboard', () => {
  let component: HrDashboard;
  let fixture: ComponentFixture<HrDashboard>;

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
      imports: [HrDashboard],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HrDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    expect(component['quickLinks'].some((link) => link.route === '/hr/dashboard')).toBe(false);
    expect(component['quickLinks'].length).toBeGreaterThan(0);
  });
});
