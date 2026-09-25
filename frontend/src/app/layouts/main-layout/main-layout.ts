import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { NAV_ITEMS_BY_ROLE } from '../../core/config/nav-items.config';
import { HasRole } from '../../shared/directives/has-role';
import { GlobalSearch } from '../../shared/global-search/global-search';
import { NotificationBell } from '../../shared/notifications/notification-bell/notification-bell';
import { Role } from '../../core/models/user.model';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  HR_MANAGER: 'HR Manager',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
};

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    HasRole,
    GlobalSearch,
    NotificationBell,
  ],
  selector: 'app-main-layout',
  styleUrl: './main-layout.scss',
  templateUrl: './main-layout.html',
})
export class MainLayout {
  private readonly authFacade = inject(AuthFacade);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly currentUser = this.authFacade.currentUser;
  protected readonly role = this.authFacade.role;

  protected readonly navItems = computed(() => {
    const role = this.role();
    return role ? NAV_ITEMS_BY_ROLE[role] : [];
  });

  protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  });

  protected readonly roleLabel = computed(() => {
    const r = this.role();
    return r ? ROLE_LABELS[r] : '';
  });

  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected logout(): void {
    this.authFacade.logout();
  }
}
