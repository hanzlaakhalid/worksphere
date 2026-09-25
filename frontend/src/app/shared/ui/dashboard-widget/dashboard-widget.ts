import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Consistent loading/empty/content chrome around a single dashboard widget
 * (a chart, a stat row, a feed) so each dashboard doesn't hand-roll the same
 * three states - mirrors the loading/success/empty/error signal pattern
 * used by every list page, just for a self-contained widget instead of a
 * paginated table.
 */
@Component({
  imports: [MatIconModule],
  selector: 'app-dashboard-widget',
  styleUrl: './dashboard-widget.scss',
  templateUrl: './dashboard-widget.html',
})
export class DashboardWidget {
  readonly title = input.required<string>();
  readonly loading = input(false);
  readonly empty = input(false);
  readonly emptyMessage = input('No data yet.');
}
