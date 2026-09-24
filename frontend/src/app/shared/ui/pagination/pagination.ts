import { Component, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

/**
 * Thin adapter around mat-paginator: the backend's page/pageSize contract
 * is 1-indexed, MatPaginator's pageIndex is 0-indexed.
 */
@Component({
  imports: [MatPaginatorModule],
  selector: 'app-pagination',
  styleUrl: './pagination.scss',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  readonly pageChange = output<{ page: number; pageSize: number }>();

  protected onPage(event: PageEvent): void {
    this.pageChange.emit({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }
}
