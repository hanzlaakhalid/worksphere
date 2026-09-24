import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Login } from './login';
import { AuthFacade } from '../../../core/state/auth/auth.facade';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authFacadeStub: {
    login: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
  };

  function configureTestBed(returnUrl: string | null) {
    TestBed.resetTestingModule();
    authFacadeStub = {
      login: vi.fn(),
      error: vi.fn().mockReturnValue(null),
      loading: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: authFacadeStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  }

  beforeEach(() => configureTestBed(null));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call authFacade.login when the form is invalid', () => {
    component['submit']();
    expect(authFacadeStub.login).not.toHaveBeenCalled();
  });

  it('marks all fields as touched when submitting an invalid form', () => {
    component['submit']();
    expect(component['form'].controls.email.touched).toBe(true);
    expect(component['form'].controls.password.touched).toBe(true);
  });

  it('calls authFacade.login with the form value when valid', () => {
    component['form'].setValue({ email: 'admin@worksphere.local', password: 'Password123!' });
    component['submit']();

    expect(authFacadeStub.login).toHaveBeenCalledWith(
      { email: 'admin@worksphere.local', password: 'Password123!' },
      undefined,
    );
  });

  it('forwards the returnUrl query param to authFacade.login', () => {
    configureTestBed('/admin-only');
    component['form'].setValue({ email: 'admin@worksphere.local', password: 'Password123!' });
    component['submit']();

    expect(authFacadeStub.login).toHaveBeenCalledWith(
      { email: 'admin@worksphere.local', password: 'Password123!' },
      '/admin-only',
    );
  });
});
