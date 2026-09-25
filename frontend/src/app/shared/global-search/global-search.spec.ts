import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { GlobalSearch } from './global-search';
import { SearchApi } from '../../core/search/search-api';
import { AuthFacade } from '../../core/state/auth/auth.facade';

const employeeResult = { id: 'emp-1', employeeCode: 'EMP-0001', firstName: 'Sofia', lastName: 'Costa', department: 'Engineering' };

function configure(role: 'ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE', searchImpl: () => unknown) {
  const searchApiStub = { search: vi.fn(searchImpl) };

  TestBed.configureTestingModule({
    imports: [GlobalSearch],
    providers: [
      provideRouter([]),
      { provide: SearchApi, useValue: searchApiStub },
      { provide: AuthFacade, useValue: { role: () => role } },
    ],
  });

  const fixture = TestBed.createComponent(GlobalSearch);
  return { fixture, component: fixture.componentInstance, searchApiStub };
}

describe('GlobalSearch', () => {
  let fixture: ComponentFixture<GlobalSearch>;

  it('does not call the API for a query shorter than 2 characters', () => {
    const setup = configure('HR_MANAGER', () => of({ data: { employees: [], departments: [], jobs: [], announcements: [] } }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['onQueryChange']('a');

    expect(setup.searchApiStub.search).not.toHaveBeenCalled();
    expect(setup.component['panelOpen']()).toBe(false);
  });

  it('searches and opens the panel once the query reaches 2 characters', () => {
    const setup = configure('HR_MANAGER', () =>
      of({ data: { employees: [employeeResult], departments: [], jobs: [], announcements: [] } }),
    );
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['onQueryChange']('so');
    fixture.detectChanges();

    expect(setup.searchApiStub.search).toHaveBeenCalledWith('so');
    expect(setup.component['panelOpen']()).toBe(true);
    expect(setup.component['hasResults']()).toBe(true);
  });

  it('navigates to the employee detail route for the current role and closes the panel', () => {
    const setup = configure('HR_MANAGER', () =>
      of({ data: { employees: [employeeResult], departments: [], jobs: [], announcements: [] } }),
    );
    fixture = setup.fixture;
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    setup.component['onQueryChange']('so');
    fixture.detectChanges();
    setup.component['goToEmployee'](employeeResult);

    expect(navigateSpy).toHaveBeenCalledWith(['/hr/employees', 'emp-1']);
    expect(setup.component['panelOpen']()).toBe(false);
  });

  it('clears results and closes the panel when the query is cleared', () => {
    const setup = configure('HR_MANAGER', () =>
      of({ data: { employees: [employeeResult], departments: [], jobs: [], announcements: [] } }),
    );
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['onQueryChange']('so');
    fixture.detectChanges();
    expect(setup.component['panelOpen']()).toBe(true);

    setup.component['onQueryChange']('');
    fixture.detectChanges();

    expect(setup.component['panelOpen']()).toBe(false);
  });
});
