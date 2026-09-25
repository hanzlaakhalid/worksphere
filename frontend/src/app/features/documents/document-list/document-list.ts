import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DocumentApi } from '../../../core/documents/document-api';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { DocumentCategory, WorkDocument } from '../../../core/models/document.model';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { resolveFileUrl } from '../../../core/utils/file-url.util';
import { DocumentUploadDialog, DocumentUploadDialogData } from '../document-upload-dialog/document-upload-dialog';

const CATEGORY_OPTIONS: DocumentCategory[] = ['POLICY', 'CONTRACT', 'CERTIFICATE', 'ID_PROOF', 'OTHER'];

@Component({
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    DataTable,
    Pagination,
  ],
  selector: 'app-document-list',
  styleUrl: './document-list.scss',
  templateUrl: './document-list.html',
})
export class DocumentList {
  private readonly documentApi = inject(DocumentApi);
  private readonly employeeApi = inject(EmployeeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** 'manage' (HR/Admin: every document, employee/category filters, upload for anyone, delete any) vs 'self' (own + company-wide, read + upload only). */
  protected readonly mode = (this.route.snapshot.data['mode'] as 'self' | 'manage') ?? 'self';

  protected readonly displayedColumns =
    this.mode === 'manage'
      ? ['title', 'category', 'employee', 'uploadedBy', 'createdAt', 'actions']
      : ['title', 'category', 'uploadedBy', 'createdAt'];

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly resolveFileUrl = resolveFileUrl;

  protected readonly loading = signal(true);
  protected readonly documents = signal<WorkDocument[]>([]);
  protected readonly total = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly employeeOptions = signal<EmployeeOption[]>([]);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly categoryFilter = signal<DocumentCategory | null>(null);
  protected readonly employeeFilter = signal<string | null>(null);
  private readonly refreshTrigger = signal(0);

  constructor() {
    if (this.mode === 'manage') {
      this.employeeApi.options().subscribe({ next: (res) => this.employeeOptions.set(res.data) });
    }

    combineLatest([
      toObservable(this.categoryFilter),
      toObservable(this.employeeFilter),
      toObservable(this.page),
      toObservable(this.pageSize),
      toObservable(this.refreshTrigger),
    ])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([category, employeeId, page, pageSize]) =>
          this.documentApi
            .list({ page, pageSize, category: category ?? undefined, employeeId: employeeId ?? undefined })
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load documents.') }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.documents.set([]);
          this.total.set(0);
          return;
        }
        this.documents.set(result.data);
        this.total.set(result.total);
      });
  }

  protected onCategoryFilterChange(value: DocumentCategory | null): void {
    this.categoryFilter.set(value);
    this.page.set(1);
  }

  protected onEmployeeFilterChange(value: string | null): void {
    this.employeeFilter.set(value);
    this.page.set(1);
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  protected openUploadDialog(): void {
    this.dialog
      .open<DocumentUploadDialog, DocumentUploadDialogData>(DocumentUploadDialog, {
        data: { canTargetEmployee: this.mode === 'manage', employeeOptions: this.employeeOptions() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }

  protected deleteDocument(doc: WorkDocument, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Delete Document',
          message: `Delete "${doc.title}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.documentApi.delete(doc.id).subscribe({
          next: () => this.refreshTrigger.update((n) => n + 1),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this document.')),
        });
      });
  }
}
