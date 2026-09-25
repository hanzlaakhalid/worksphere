import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { JobFormDialog } from './job-form-dialog';
import { JobApi } from '../../../core/recruitment/job-api';

function configure(job: unknown) {
  const jobApiStub = {
    create: vi.fn().mockReturnValue(of({ data: { id: 'new-job' } })),
    update: vi.fn().mockReturnValue(of({ data: { id: 'job-1' } })),
  };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [JobFormDialog],
    providers: [
      { provide: JobApi, useValue: jobApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { job, departments: [] } },
    ],
  });

  const fixture = TestBed.createComponent(JobFormDialog);
  return { fixture, component: fixture.componentInstance, jobApiStub, dialogRefStub };
}

describe('JobFormDialog', () => {
  let fixture: ComponentFixture<JobFormDialog>;

  it('starts in create mode with an empty form when no job is given', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['isEditMode']).toBe(false);
    expect(setup.component['form'].controls.title.value).toBe('');
  });

  it('does not submit an invalid form', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.jobApiStub.create).not.toHaveBeenCalled();
  });

  it('creates a job and closes the dialog with the result', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({
      title: 'Senior Backend Engineer',
      description: 'Own the core API platform.',
      requirements: '5+ years experience required.',
      location: 'Remote',
    });
    setup.component['submit']();

    expect(setup.jobApiStub.create).toHaveBeenCalled();
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'new-job' });
  });
});
