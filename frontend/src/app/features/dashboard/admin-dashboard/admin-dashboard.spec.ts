import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboard } from './admin-dashboard';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { User } from '../../../core/models/user.model';

describe('AdminDashboard', () => {
  let component: AdminDashboard;
  let fixture: ComponentFixture<AdminDashboard>;

  const testUser: User = {
    id: '1',
    email: 'admin@worksphere.local',
    firstName: 'Alex',
    lastName: 'Admin',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: { currentUser: () => testUser } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('excludes the dashboard route from its own quick links', () => {
    expect(component['quickLinks'].some((link) => link.route === '/admin/dashboard')).toBe(false);
    expect(component['quickLinks'].length).toBeGreaterThan(0);
  });
});
