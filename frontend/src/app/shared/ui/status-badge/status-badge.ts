import { Component, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'neutral' | 'danger';

@Component({
  imports: [],
  selector: 'app-status-badge',
  styleUrl: './status-badge.scss',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly variant = input<BadgeVariant>('neutral');
}
