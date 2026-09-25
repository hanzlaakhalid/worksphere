import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { InterviewDialog } from './interview-dialog';
import { ApplicationApi } from '../../../core/recruitment/application-api';

function configure() {
  const applicationApiStub = { addInterview: vi.fn().mockReturnValue(of({ data: { id: 'app-1' } })) };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [InterviewDialog],
    providers: [
      { provide: ApplicationApi, useValue: applicationApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { applicationId: 'app-1', employeeOptions: [] } },
    ],
  });

  const fixture = TestBed.createComponent(InterviewDialog);
  return { fixture, component: fixture.componentInstance, applicationApiStub, dialogRefStub };
}

describe('InterviewDialog', () => {
  let fixture: ComponentFixture<InterviewDialog>;

  it('does not submit without a date', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.applicationApiStub.addInterview).not.toHaveBeenCalled();
  });

  it('submits and closes with the updated application', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({ scheduledAt: new Date('2026-10-05') });
    setup.component['submit']();

    expect(setup.applicationApiStub.addInterview).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ interviewerId: null, notes: null }),
    );
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'app-1' });
  });
});
