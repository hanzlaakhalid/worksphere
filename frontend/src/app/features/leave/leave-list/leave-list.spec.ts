import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { LeaveList } from './leave-list';
import { LeaveApi } from '../../../core/leaves/leave-api';

const request = {
  id: 'leave-1',
  employee: { id: 'emp-1', employeeCode: 'EMP-0001', firstName: 'Sofia', lastName: 'Costa', department: 'Engineering' },
  leaveType: 'ANNUAL',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  durationDays: 1,
  reason: 'Trip',
  attachmentUrl: null,
  status: 'PENDING',
  reviewedBy: null,
  reviewNote: null,
  createdAt: new Date().toISOString(),
};

function configure(mode: 'self' | 'review', listImpl: () => unknown) {
  const leaveApiStub = {
    list: vi.fn(listImpl),
    approve: vi.fn().mockReturnValue(of({ data: { ...request, status: 'APPROVED' } })),
    reject: vi.fn().mockReturnValue(of({ data: { ...request, status: 'REJECTED' } })),
  };

  TestBed.configureTestingModule({
    imports: [LeaveList],
    providers: [
      { provide: LeaveApi, useValue: leaveApiStub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode } } } },
    ],
  });

  const fixture = TestBed.createComponent(LeaveList);
  return { fixture, component: fixture.componentInstance, leaveApiStub };
}

describe('LeaveList', () => {
  let fixture: ComponentFixture<LeaveList>;

  it('defaults the status filter to PENDING in review mode', () => {
    const setup = configure('review', () => of({ data: [request], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['statusFilter']()).toBe('PENDING');
    expect(setup.leaveApiStub.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }));
  });

  it('shows all statuses by default in self mode', () => {
    const setup = configure('self', () => of({ data: [request], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['statusFilter']()).toBeNull();
  });

  it('sets an error message on failure', () => {
    const setup = configure('review', () => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('approves a request and refreshes the list', () => {
    const setup = configure('review', () => of({ data: [request], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.leaveApiStub.list.mockClear();

    setup.component['approve'](request as never);
    fixture.detectChanges();

    expect(setup.leaveApiStub.approve).toHaveBeenCalledWith('leave-1');
    expect(setup.leaveApiStub.list).toHaveBeenCalled();
  });

  it('rejects a request with the dialog result and refreshes the list', () => {
    const setup = configure('review', () => of({ data: [request], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.leaveApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of('Not enough coverage') } as never);

    setup.component['reject'](request as never);
    fixture.detectChanges();

    expect(setup.leaveApiStub.reject).toHaveBeenCalledWith('leave-1', 'Not enough coverage');
    expect(setup.leaveApiStub.list).toHaveBeenCalled();
  });

  it('does not reject when the dialog is dismissed without a reason', () => {
    const setup = configure('review', () => of({ data: [request], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(undefined) } as never);

    setup.component['reject'](request as never);

    expect(setup.leaveApiStub.reject).not.toHaveBeenCalled();
  });
});
