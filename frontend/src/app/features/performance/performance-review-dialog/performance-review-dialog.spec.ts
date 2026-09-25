import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { PerformanceReviewDialog } from './performance-review-dialog';
import { PerformanceApi } from '../../../core/performance/performance-api';

function configure(createImpl: () => unknown) {
  const performanceApiStub = { create: vi.fn(createImpl) };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [PerformanceReviewDialog],
    providers: [
      { provide: PerformanceApi, useValue: performanceApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { teamOptions: [{ id: 'emp-1', name: 'Sofia Costa' }] } },
    ],
  });

  const fixture = TestBed.createComponent(PerformanceReviewDialog);
  return { fixture, component: fixture.componentInstance, performanceApiStub, dialogRefStub };
}

describe('PerformanceReviewDialog', () => {
  let fixture: ComponentFixture<PerformanceReviewDialog>;

  it('does not submit an invalid form', () => {
    const setup = configure(() => of({ data: {} }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.performanceApiStub.create).not.toHaveBeenCalled();
  });

  it('submits and closes with the created review', () => {
    const created = { id: 'rev-1' };
    const setup = configure(() => of({ data: created }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      employeeId: 'emp-1',
      reviewPeriod: 'Q2 2026',
      goals: 'Ship the thing',
      achievements: 'Shipped the thing',
      strengths: 'Very capable',
      areasForImprovement: 'Delegate more',
      managerComments: 'Great quarter',
    });
    setup.component['submit']();

    expect(setup.performanceApiStub.create).toHaveBeenCalled();
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows an error message when submission fails', () => {
    const setup = configure(() => throwError(() => ({ status: 403 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      employeeId: 'emp-1',
      reviewPeriod: 'Q2 2026',
      goals: 'Ship the thing',
      achievements: 'Shipped the thing',
      strengths: 'Very capable',
      areasForImprovement: 'Delegate more',
      managerComments: 'Great quarter',
    });
    setup.component['submit']();

    expect(setup.component['error']()).toBeTruthy();
    expect(setup.dialogRefStub.close).not.toHaveBeenCalled();
  });
});
