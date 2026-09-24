import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable stat/quick-link tile. Supports both a "quick link" variant
 * (icon + title + routerLink, used by the Phase 3 dashboard placeholders)
 * and a "stat" variant (icon + title + value + subtitle, for the real
 * KPI tiles added in Phase 8) without changing its API.
 */
@Component({
  imports: [MatCardModule, MatIconModule, RouterLink],
  selector: 'app-dashboard-card',
  styleUrl: './dashboard-card.scss',
  templateUrl: './dashboard-card.html',
})
export class DashboardCard {
  readonly icon = input('dashboard');
  readonly title = input.required<string>();
  readonly value = input<string>();
  readonly subtitle = input<string>();
  readonly routerLink = input<string>();
}
