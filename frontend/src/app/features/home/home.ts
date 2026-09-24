import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AuthFacade } from '../../core/state/auth/auth.facade';

/**
 * Temporary placeholder landing page for Phase 2 (auth) verification.
 * Replaced in Phase 3 by the real role-based dashboard layout + sidebar.
 */
@Component({
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly authFacade = inject(AuthFacade);

  protected logout(): void {
    this.authFacade.logout();
  }
}
