import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DepartmentList } from './department-list';
import { DepartmentApi } from '../../../core/departments/department-api';
import { Department } from '../../../core/models/department.model';

const department: Department = {
  id: 'dept-1',
  name: 'Engineering',
  description: 'Builds things',
  manager: null,
  employeeCount: 4,
  createdAt: new Date().toISOString(),
};

function configureTestBed(listImpl: () => unknown) {
  const departmentApiStub = {
    list: vi.fn(listImpl),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };

  TestBed.configureTestingModule({
    imports: [DepartmentList],
    providers: [{ provide: DepartmentApi, useValue: departmentApiStub }],
  });

  const fixture = TestBed.createComponent(DepartmentList);
  return { fixture, component: fixture.componentInstance, departmentApiStub };
}

describe('DepartmentList', () => {
  let fixture: ComponentFixture<DepartmentList>;

  it('loads and displays departments on success', () => {
    const setup = configureTestBed(() => of({ data: [department] }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['departments']()).toEqual([department]);
    expect(setup.component['loading']()).toBe(false);
  });

  it('sets an error on failure', () => {
    const setup = configureTestBed(() => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
    expect(setup.component['loading']()).toBe(false);
  });

  it('reloads the list after creating a department via the dialog', () => {
    const setup = configureTestBed(() => of({ data: [] }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.departmentApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({
      afterClosed: () => of({ id: 'dept-2', name: 'Operations' }),
    } as never);

    setup.component['openCreateDialog']();

    expect(setup.departmentApiStub.list).toHaveBeenCalled();
  });

  it('does not reload when the dialog is dismissed without a result', () => {
    const setup = configureTestBed(() => of({ data: [] }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.departmentApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(undefined) } as never);

    setup.component['openCreateDialog']();

    expect(setup.departmentApiStub.list).not.toHaveBeenCalled();
  });

  it('deletes and reloads after confirmation', () => {
    const setup = configureTestBed(() => of({ data: [department] }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.departmentApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['deleteDepartment'](department, new Event('click'));

    expect(setup.departmentApiStub.delete).toHaveBeenCalledWith('dept-1');
    expect(setup.departmentApiStub.list).toHaveBeenCalled();
  });
});
