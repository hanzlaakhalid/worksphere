import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ApplicationFormDialog } from './application-form-dialog';
import { ApplicationApi } from '../../../core/recruitment/application-api';

function configure(createImpl: () => unknown, preselectedJobId: string | null = null) {
  const applicationApiStub = { create: vi.fn(createImpl) };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [ApplicationFormDialog],
    providers: [
      { provide: ApplicationApi, useValue: applicationApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { jobOptions: [{ id: 'job-1', title: 'Engineer' }], preselectedJobId },
      },
    ],
  });

  const fixture = TestBed.createComponent(ApplicationFormDialog);
  return { fixture, component: fixture.componentInstance, applicationApiStub, dialogRefStub };
}

describe('ApplicationFormDialog', () => {
  let fixture: ComponentFixture<ApplicationFormDialog>;

  it('pre-selects the job when one is provided', () => {
    const setup = configure(() => of({ data: {} }), 'job-1');
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['form'].controls.jobId.value).toBe('job-1');
  });

  it('does not submit an invalid form', () => {
    const setup = configure(() => of({ data: {} }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.applicationApiStub.create).not.toHaveBeenCalled();
  });

  it('submits and closes with the created application', () => {
    const created = { id: 'app-1' };
    const setup = configure(() => of({ data: created }));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      jobId: 'job-1',
      firstName: 'Wei',
      lastName: 'Zhang',
      email: 'wei@applicant.example',
    });
    setup.component['submit']();

    expect(setup.applicationApiStub.create).toHaveBeenCalled();
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith(created);
  });

  it('shows an error on failure', () => {
    const setup = configure(() => throwError(() => ({ status: 409 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      jobId: 'job-1',
      firstName: 'Wei',
      lastName: 'Zhang',
      email: 'wei@applicant.example',
    });
    setup.component['submit']();

    expect(setup.component['error']()).toBeTruthy();
  });
});
