import { Component, input } from '@angular/core';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { EmptyState } from '../empty-state/empty-state';

/**
 * Standardizes the loading/empty chrome around a list. The caller owns and
 * projects its own complete `<table mat-table>` (column/row defs included) -
 * MatTable's content-children query for MatColumnDef does not reliably
 * traverse an intermediate component's <ng-content>, so this wrapper
 * doesn't try to own the table itself, only the states around it.
 */
@Component({
  imports: [LoadingSpinner, EmptyState],
  selector: 'app-data-table',
  styleUrl: './data-table.scss',
  templateUrl: './data-table.html',
})
export class DataTable {
  readonly loading = input(false);
  readonly empty = input(false);
  readonly emptyIcon = input('inbox');
  readonly emptyTitle = input('No results found');
  readonly emptyDescription = input<string>();
}
