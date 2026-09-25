import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AnnouncementFormDialog } from './announcement-form-dialog';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';

const announcement = {
  id: 'ann-1',
  title: 'Existing',
  content: 'Existing content',
  publishedAt: new Date('2026-09-01').toISOString(),
  expiresAt: null,
  createdBy: { id: 'emp-hr', firstName: 'Hana', lastName: 'Reyes' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function configure(existing: unknown) {
  const announcementApiStub = {
    create: vi.fn().mockReturnValue(of({ data: { id: 'new-ann' } })),
    update: vi.fn().mockReturnValue(of({ data: { id: 'ann-1' } })),
  };
  const dialogRefStub = { close: vi.fn() };

  TestBed.configureTestingModule({
    imports: [AnnouncementFormDialog],
    providers: [
      { provide: AnnouncementApi, useValue: announcementApiStub },
      { provide: MatDialogRef, useValue: dialogRefStub },
      { provide: MAT_DIALOG_DATA, useValue: { announcement: existing } },
    ],
  });

  const fixture = TestBed.createComponent(AnnouncementFormDialog);
  return { fixture, component: fixture.componentInstance, announcementApiStub, dialogRefStub };
}

describe('AnnouncementFormDialog', () => {
  let fixture: ComponentFixture<AnnouncementFormDialog>;

  it('starts in create mode with an empty form when no announcement is given', () => {
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
    setup.component['form'].patchValue({ title: '', content: '' });

    setup.component['submit']();

    expect(setup.announcementApiStub.create).not.toHaveBeenCalled();
  });

  it('creates an announcement and closes the dialog with the result', () => {
    const setup = configure(null);
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['form'].patchValue({ title: 'New update', content: 'Body text' });
    setup.component['submit']();

    expect(setup.announcementApiStub.create).toHaveBeenCalled();
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'new-ann' });
  });

  it('pre-fills the form and updates in edit mode', () => {
    const setup = configure(announcement);
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['isEditMode']).toBe(true);
    expect(setup.component['form'].controls.title.value).toBe('Existing');

    setup.component['submit']();

    expect(setup.announcementApiStub.update).toHaveBeenCalledWith('ann-1', expect.objectContaining({ title: 'Existing' }));
    expect(setup.dialogRefStub.close).toHaveBeenCalledWith({ id: 'ann-1' });
  });
});
