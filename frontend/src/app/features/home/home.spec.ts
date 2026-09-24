import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { User } from '../../core/models/user.model';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let authFacadeStub: {
    logout: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
    role: ReturnType<typeof vi.fn>;
  };

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
    authFacadeStub = {
      logout: vi.fn(),
      currentUser: vi.fn().mockReturnValue(testUser),
      role: vi.fn().mockReturnValue('ADMIN'),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: authFacadeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls authFacade.logout when logging out', () => {
    component['logout']();
    expect(authFacadeStub.logout).toHaveBeenCalled();
  });
});
