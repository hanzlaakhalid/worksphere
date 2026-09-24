import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DepartmentFormDialog } from './department-form-dialog';
import { DepartmentApi } from '../../../core/departments/department-api';
import { EmployeeApi } from '../../../core/employees/employee-api';

function configureTestBed(department: { id: string; name: string; description: string | null; manager: null } | null) {
  const departmentApiStub = {
    create: vi.fn().mockReturnValue(of({ data: { id: 'new-dept' } })),
    update: vi.fn().mockReturnValue(of({ data: { id: department?.id } })),
  };
  const employeeApiStub = { options: vi.fn().mockReturnValue(of({ data: [] })) };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [DepartmentFormDialog],
    providers: [
      { provide: DepartmentApi, useValue: departmentApiStub },
      { provide: EmployeeApi, useValue: employeeApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { department } },
    ],
  });

  const fixture = TestBed.createComponent(DepartmentFormDialog);
  return { fixture, component: fixture.componentInstance, departmentApiStub, dialogRefStub };
}

describe('DepartmentFormDialog', () => {
  let fixture: ComponentFixture<DepartmentFormDialog>;

  it('starts in create mode with an empty form when no department is given', () => {
    const setup = configureTestBed(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['isEditMode']).toBe(false);
    expect(setup.component['form'].controls.name.value).toBe('');
  });

  it('pre-fills the form in edit mode', () => {
    const setup = configureTestBed({ id: 'dept-1', name: 'Engineering', description: 'Builds things', manager: null });
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['isEditMode']).toBe(true);
    expect(setup.component['form'].controls.name.value).toBe('Engineering');
    expect(setup.component['form'].controls.description.value).toBe('Builds things');
  });

  it('does not submit an invalid form', () => {
    const setup = configureTestBed(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['submit']();

    expect(setup.departmentApiStub.create).not.toHaveBeenCalled();
  });

  it('creates a department and closes the dialog with the result', () => {
    const setup = configureTestBed(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({ name: 'Operations' });
    setup.component['submit']();

    expect(setup.departmentApiStub.create).toHaveBeenCalledWith({
      name: 'Operations',
      description: '',
      managerId: null,
    });
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'new-dept' });
  });
});
