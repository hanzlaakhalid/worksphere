import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { NotificationBell } from './notification-bell';
import { NotificationApi } from '../../../core/notifications/notification-api';

const notification = {
  id: 'n-1',
  type: 'LEAVE_APPROVED' as const,
  title: 'Leave request approved',
  message: 'Your annual leave request has been approved.',
  link: '/employee/leave',
  isRead: false,
  createdAt: new Date().toISOString(),
};

function configure() {
  const notificationApiStub = {
    unreadCount: vi.fn().mockReturnValue(of({ data: { count: 2 } })),
    list: vi.fn().mockReturnValue(of({ data: [notification], page: 1, pageSize: 10, total: 1 })),
    markRead: vi.fn().mockReturnValue(of({ data: { ...notification, isRead: true } })),
    markAllRead: vi.fn().mockReturnValue(of(undefined)),
  };

  TestBed.configureTestingModule({
    imports: [NotificationBell],
    providers: [provideRouter([]), { provide: NotificationApi, useValue: notificationApiStub }],
  });

  const fixture = TestBed.createComponent(NotificationBell);
  return { fixture, component: fixture.componentInstance, notificationApiStub };
}

describe('NotificationBell', () => {
  let fixture: ComponentFixture<NotificationBell>;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('polls the unread count on init', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    expect(setup.notificationApiStub.unreadCount).toHaveBeenCalledTimes(1);
    expect(setup.component['unreadCount']()).toBe(2);
  });

  it('polls again after the interval elapses', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    vi.advanceTimersByTime(30000);

    expect(setup.notificationApiStub.unreadCount).toHaveBeenCalledTimes(2);
  });

  it('loads recent notifications when the panel opens', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();

    setup.component['onPanelOpened']();

    expect(setup.notificationApiStub.list).toHaveBeenCalled();
    expect(setup.component['notifications']()).toEqual([notification]);
  });

  it('marks a notification read and navigates to its link on select', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    setup.component['selectNotification'](notification);

    expect(setup.notificationApiStub.markRead).toHaveBeenCalledWith('n-1');
    expect(setup.component['unreadCount']()).toBe(1);
    expect(navigateSpy).toHaveBeenCalledWith('/employee/leave');
  });

  it('marks all notifications read', () => {
    const setup = configure();
    fixture = setup.fixture;
    fixture.detectChanges();
    setup.component['onPanelOpened']();

    setup.component['markAllRead'](new Event('click'));

    expect(setup.notificationApiStub.markAllRead).toHaveBeenCalled();
    expect(setup.component['unreadCount']()).toBe(0);
    expect(setup.component['notifications']()[0].isRead).toBe(true);
  });
});
