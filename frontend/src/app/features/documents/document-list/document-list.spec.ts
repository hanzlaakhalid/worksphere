import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DocumentList } from './document-list';
import { DocumentApi } from '../../../core/documents/document-api';
import { EmployeeApi } from '../../../core/employees/employee-api';

const document = {
  id: 'doc-1',
  title: 'Employee Handbook',
  category: 'POLICY',
  fileUrl: '/uploads/handbook.txt',
  employee: null,
  uploadedBy: { id: 'emp-hr', firstName: 'Hana', lastName: 'Reyes' },
  createdAt: new Date().toISOString(),
};

function configure(mode: 'self' | 'manage', listImpl: () => unknown) {
  const documentApiStub = {
    list: vi.fn(listImpl),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };
  const employeeApiStub = { options: vi.fn().mockReturnValue(of({ data: [] })) };

  TestBed.configureTestingModule({
    imports: [DocumentList],
    providers: [
      { provide: DocumentApi, useValue: documentApiStub },
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode } } } },
    ],
  });

  const fixture = TestBed.createComponent(DocumentList);
  return { fixture, component: fixture.componentInstance, documentApiStub, employeeApiStub };
}

describe('DocumentList', () => {
  let fixture: ComponentFixture<DocumentList>;

  it('loads own + company-wide documents in self mode without loading employee options', () => {
    const setup = configure('self', () => of({ data: [document], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['documents']()).toEqual([document]);
    expect(setup.employeeApiStub.options).not.toHaveBeenCalled();
  });

  it('loads employee options in manage mode', () => {
    const setup = configure('manage', () => of({ data: [document], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.employeeApiStub.options).toHaveBeenCalled();
  });

  it('sets an error message on failure', () => {
    const setup = configure('manage', () => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('opens the upload dialog and reloads on a result', () => {
    const setup = configure('manage', () => of({ data: [document], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.documentApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(document) } as never);

    setup.component['openUploadDialog']();
    fixture.detectChanges();

    expect(setup.documentApiStub.list).toHaveBeenCalled();
  });

  it('deletes a document after confirmation and reloads', () => {
    const setup = configure('manage', () => of({ data: [document], page: 1, pageSize: 20, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.documentApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['deleteDocument'](document as never, new Event('click'));
    fixture.detectChanges();

    expect(setup.documentApiStub.delete).toHaveBeenCalledWith('doc-1');
    expect(setup.documentApiStub.list).toHaveBeenCalled();
  });
});
