import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { LeaveRequestDialog } from './leave-request-dialog';
import { LeaveApi } from '../../../core/leaves/leave-api';

function configure(createImpl: () => unknown) {
  const leaveApiStub = { create: vi.fn(createImpl) };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [LeaveRequestDialog],
    providers: [
      { provide: LeaveApi, useValue: leaveApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
    ],
  });

  const fixture = TestBed.createComponent(LeaveRequestDialog);
  return { fixture, component: fixture.componentInstance, leaveApiStub, dialogRefStub };
}

describe('LeaveRequestDialog', () => {
  let fixture: ComponentFixture<LeaveRequestDialog>;

  it('does not submit an invalid form', () => {
    const setup = configure(() => of({ data: {} }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.leaveApiStub.create).not.toHaveBeenCalled();
  });

  it('flags an end date before the start date', () => {
    const setup = configure(() => of({ data: {} }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-05'),
    });

    expect(setup.component['form'].controls.endDate.hasError('endBeforeStart')).toBe(true);
  });

  it('submits and closes the dialog with the created leave request', () => {
    const created = { id: 'leave-1', status: 'PENDING' };
    const setup = configure(() => of({ data: created }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      leaveType: 'CASUAL',
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-10'),
      reason: 'Personal errand day.',
    });
    setup.component['submit']();

    expect(setup.leaveApiStub.create).toHaveBeenCalled();
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows an error message when submission fails', () => {
    const setup = configure(() => throwError(() => ({ status: 422 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      leaveType: 'CASUAL',
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-10'),
      reason: 'Personal errand day.',
    });
    setup.component['submit']();

    expect(setup.component['error']()).toBeTruthy();
    expect(setup.dialogRefStub.close).not.toHaveBeenCalled();
  });
});
