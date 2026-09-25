import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SearchInput } from '../ui/search-input/search-input';
import { SearchApi } from '../../core/search/search-api';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { Role } from '../../core/models/user.model';
import { SearchAnnouncementResult, SearchDepartmentResult, SearchEmployeeResult, SearchJobResult, SearchResults } from '../../core/models/search.model';

const EMPLOYEES_BASE_PATH: Partial<Record<Role, string>> = {
  ADMIN: '/admin/employees',
  HR_MANAGER: '/hr/employees',
  MANAGER: '/manager/team',
};

const DEPARTMENTS_BASE_PATH: Partial<Record<Role, string>> = {
  ADMIN: '/admin/departments',
  HR_MANAGER: '/hr/departments',
};

const ANNOUNCEMENTS_BASE_PATH: Record<Role, string> = {
  ADMIN: '/admin/announcements',
  HR_MANAGER: '/hr/announcements',
  MANAGER: '/manager/announcements',
  EMPLOYEE: '/employee/announcements',
};

const EMPTY_RESULTS: SearchResults = { employees: [], departments: [], jobs: [], announcements: [] };

@Component({
  imports: [MatIconModule, SearchInput],
  selector: 'app-global-search',
  styleUrl: './global-search.scss',
  templateUrl: './global-search.html',
})
export class GlobalSearch {
  private readonly searchApi = inject(SearchApi);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly query = signal('');
  protected readonly loading = signal(false);
  protected readonly results = signal<SearchResults>(EMPTY_RESULTS);
  protected readonly panelOpen = signal(false);

  constructor() {
    toObservable(this.query)
      .pipe(
        switchMap((q) => {
          const trimmed = q.trim();
          if (trimmed.length < 2) {
            this.loading.set(false);
            return of(EMPTY_RESULTS);
          }
          this.loading.set(true);
          return this.searchApi.search(trimmed).pipe(
            catchError(() => of({ data: EMPTY_RESULTS })),
            switchMap((res) => of(res.data)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.loading.set(false);
        this.results.set(results);
        this.panelOpen.set(this.query().trim().length >= 2);
      });
  }

  @HostListener('document:mousedown', ['$event'])
  protected onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.panelOpen.set(false);
    }
  }

  protected readonly hasResults = () => {
    const r = this.results();
    return r.employees.length > 0 || r.departments.length > 0 || r.jobs.length > 0 || r.announcements.length > 0;
  };

  protected onQueryChange(value: string): void {
    this.query.set(value);
  }

  protected goToEmployee(result: SearchEmployeeResult): void {
    const role = this.authFacade.role();
    const base = role ? EMPLOYEES_BASE_PATH[role] : undefined;
    if (base) this.router.navigate([base, result.id]);
    this.closePanel();
  }

  protected goToDepartments(_result: SearchDepartmentResult): void {
    const role = this.authFacade.role();
    const base = role ? DEPARTMENTS_BASE_PATH[role] : undefined;
    if (base) this.router.navigateByUrl(base);
    this.closePanel();
  }

  protected goToJobs(_result: SearchJobResult): void {
    this.router.navigateByUrl('/hr/recruitment/jobs');
    this.closePanel();
  }

  protected goToAnnouncements(_result: SearchAnnouncementResult): void {
    const role = this.authFacade.role();
    if (role) this.router.navigateByUrl(ANNOUNCEMENTS_BASE_PATH[role]);
    this.closePanel();
  }

  private closePanel(): void {
    this.panelOpen.set(false);
    this.query.set('');
  }
}
