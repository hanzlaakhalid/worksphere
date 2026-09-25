import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DocumentUploadDialog } from './document-upload-dialog';
import { DocumentApi } from '../../../core/documents/document-api';

function configure(canTargetEmployee: boolean) {
  const documentApiStub = { create: vi.fn().mockReturnValue(of({ data: { id: 'doc-1' } })) };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [DocumentUploadDialog],
    providers: [
      { provide: DocumentApi, useValue: documentApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { canTargetEmployee, employeeOptions: [] } },
    ],
  });

  const fixture = TestBed.createComponent(DocumentUploadDialog);
  return { fixture, component: fixture.componentInstance, documentApiStub, dialogRefStub };
}

describe('DocumentUploadDialog', () => {
  let fixture: ComponentFixture<DocumentUploadDialog>;

  it('does not submit without a file uploaded', () => {
    const setup = configure(false);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({ title: 'Handbook' });
    setup.component['submit']();

    expect(setup.documentApiStub.create).not.toHaveBeenCalled();
  });

  it('submits and closes with the created document', () => {
    const setup = configure(true);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({ title: 'Handbook', category: 'POLICY' });
    setup.component['onFileUploaded']('/uploads/a.pdf');
    setup.component['submit']();

    expect(setup.documentApiStub.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Handbook', category: 'POLICY', fileUrl: '/uploads/a.pdf' }),
    );
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'doc-1' });
  });
});
