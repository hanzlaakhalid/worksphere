import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';
import { AuthFacade } from '../../../core/state/auth/auth.facade';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authFacadeStub: {
    register: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authFacadeStub = {
      register: vi.fn(),
      error: vi.fn().mockReturnValue(null),
      loading: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: authFacadeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call authFacade.register when the form is invalid', () => {
    component['submit']();
    expect(authFacadeStub.register).not.toHaveBeenCalled();
  });

  it('flags a mismatched confirm password', () => {
    component['form'].setValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@worksphere.local',
      password: 'Password123',
      confirmPassword: 'Different123',
    });

    expect(component['form'].controls.confirmPassword.hasError('passwordMismatch')).toBe(true);
  });

  it('calls authFacade.register without confirmPassword when valid', () => {
    component['form'].setValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@worksphere.local',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    component['submit']();

    expect(authFacadeStub.register).toHaveBeenCalledWith({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@worksphere.local',
      password: 'Password123',
    });
  });
});
