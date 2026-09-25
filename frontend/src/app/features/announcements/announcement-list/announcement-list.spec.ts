import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AnnouncementList } from './announcement-list';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';

const announcement = {
  id: 'ann-1',
  title: 'Q1 All-Hands',
  content: 'Join us Friday.',
  publishedAt: new Date().toISOString(),
  expiresAt: null,
  createdBy: { id: 'emp-hr', firstName: 'Hana', lastName: 'Reyes' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function configure(mode: 'view' | 'manage', listImpl: () => unknown) {
  const announcementApiStub = {
    list: vi.fn(listImpl),
    delete: vi.fn().mockReturnValue(of(undefined)),
  };

  TestBed.configureTestingModule({
    imports: [AnnouncementList],
    providers: [
      { provide: AnnouncementApi, useValue: announcementApiStub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { mode } } } },
    ],
  });

  const fixture = TestBed.createComponent(AnnouncementList);
  return { fixture, component: fixture.componentInstance, announcementApiStub };
}

describe('AnnouncementList', () => {
  let fixture: ComponentFixture<AnnouncementList>;

  it('loads announcements on success', () => {
    const setup = configure('view', () => of({ data: [announcement], page: 1, pageSize: 10, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['announcements']()).toEqual([announcement]);
    expect(setup.component['loading']()).toBe(false);
  });

  it('sets an error message on failure', () => {
    const setup = configure('view', () => throwError(() => ({ status: 500 })));
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.component['error']()).toBeTruthy();
  });

  it('opens the new announcement dialog and reloads on a result', () => {
    const setup = configure('manage', () => of({ data: [announcement], page: 1, pageSize: 10, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.announcementApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(announcement) } as never);

    setup.component['openNewDialog']();
    fixture.detectChanges();

    expect(setup.announcementApiStub.list).toHaveBeenCalled();
  });

  it('deletes an announcement after confirmation and reloads', () => {
    const setup = configure('manage', () => of({ data: [announcement], page: 1, pageSize: 10, total: 1 }));
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.announcementApiStub.list.mockClear();

    vi.spyOn(MatDialog.prototype, 'open').mockReturnValue({ afterClosed: () => of(true) } as never);

    setup.component['deleteAnnouncement'](announcement as never);
    fixture.detectChanges();

    expect(setup.announcementApiStub.delete).toHaveBeenCalledWith('ann-1');
    expect(setup.announcementApiStub.list).toHaveBeenCalled();
  });
});
