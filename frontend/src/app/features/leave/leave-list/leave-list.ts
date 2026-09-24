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
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { LeaveApi } from '../../../core/leaves/leave-api';
import { LeaveListQuery, LeaveRequest, LeaveStatus, LeaveType } from '../../../core/models/leave.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { leaveStatusVariant } from '../../../core/utils/status-variant.util';
import { LeaveRequestDialog } from '../leave-request-dialog/leave-request-dialog';
import { RejectLeaveDialog } from '../reject-leave-dialog/reject-leave-dialog';

const STATUS_OPTIONS: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
  CASUAL: 'Casual',
  EMERGENCY: 'Emergency',
  UNPAID: 'Unpaid',
};

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
    StatusBadge,
  ],
  selector: 'app-leave-list',
  styleUrl: './leave-list.scss',
  templateUrl: './leave-list.html',
})
export class LeaveList {
  private readonly leaveApi = inject(LeaveApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** 'self' (employee: own history + submit) vs 'review' (manager/hr: approval queue). */
  protected readonly mode = (this.route.snapshot.data['mode'] as 'self' | 'review') ?? 'review';

  protected readonly displayedColumns =
    this.mode === 'self'
      ? ['leaveType', 'startDate', 'endDate', 'duration', 'reason', 'status', 'reviewNote']
      : ['employee', 'leaveType', 'duration', 'reason', 'submittedDate', 'status', 'actions'];

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly leaveStatusVariant = leaveStatusVariant;

  protected leaveTypeLabel(type: LeaveType): string {
    return LEAVE_TYPE_LABELS[type];
  }

  protected readonly loading = signal(true);
  protected readonly requests = signal<LeaveRequest[]>([]);
  protected readonly total = signal(0);
  protected readonly error = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly statusFilter = signal<LeaveStatus | null>(this.mode === 'review' ? 'PENDING' : null);
  private readonly refreshTrigger = signal(0);

  constructor() {
    combineLatest([toObservable(this.statusFilter), toObservable(this.page), toObservable(this.pageSize), toObservable(this.refreshTrigger)])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([status, page, pageSize]) =>
          this.leaveApi
            .list({ page, pageSize, status: status ?? undefined } as LeaveListQuery)
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load leave requests.') }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.requests.set([]);
          this.total.set(0);
          return;
        }
        this.requests.set(result.data);
        this.total.set(result.total);
      });
  }

  protected onStatusFilterChange(value: LeaveStatus | null): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  protected requestLeave(): void {
    this.dialog
      .open(LeaveRequestDialog)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshTrigger.update((n) => n + 1);
        }
      });
  }

  protected approve(request: LeaveRequest): void {
    this.leaveApi.approve(request.id).subscribe({
      next: () => this.refreshTrigger.update((n) => n + 1),
      error: (err) => this.error.set(extractErrorMessage(err, 'Unable to approve this request.')),
    });
  }

  protected reject(request: LeaveRequest): void {
    this.dialog
      .open(RejectLeaveDialog)
      .afterClosed()
      .subscribe((reviewNote: string | undefined) => {
        if (!reviewNote) return;
        this.leaveApi.reject(request.id, reviewNote).subscribe({
          next: () => this.refreshTrigger.update((n) => n + 1),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to reject this request.')),
        });
      });
  }
}
