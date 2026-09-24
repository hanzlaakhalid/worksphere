import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HasRole } from './has-role';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { Role } from '../../core/models/user.model';

@Component({
  imports: [HasRole],
  template: `
    <span *appHasRole="'ADMIN'" class="admin-only">Admin content</span>
    <span *appHasRole="['ADMIN', 'HR_MANAGER']" class="admin-or-hr">Admin or HR content</span>
  `,
})
class HostComponent {}

describe('HasRole', () => {
  let fixture: ComponentFixture<HostComponent>;
  let roleSignal: ReturnType<typeof signal<Role | null>>;

  beforeEach(() => {
    roleSignal = signal<Role | null>(null);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthFacade, useValue: { role: roleSignal } }],
    });

    fixture = TestBed.createComponent(HostComponent);
  });

  function query(selector: string) {
    return fixture.nativeElement.querySelector(selector);
  }

  it('hides role-gated content when there is no current user', () => {
    fixture.detectChanges();
    expect(query('.admin-only')).toBeNull();
    expect(query('.admin-or-hr')).toBeNull();
  });

  it('shows single-role content only for a matching role', () => {
    roleSignal.set('ADMIN');
    fixture.detectChanges();
    expect(query('.admin-only')).not.toBeNull();

    roleSignal.set('EMPLOYEE');
    fixture.detectChanges();
    expect(query('.admin-only')).toBeNull();
  });

  it('shows multi-role content for any role in the list', () => {
    roleSignal.set('HR_MANAGER');
    fixture.detectChanges();
    expect(query('.admin-or-hr')).not.toBeNull();

    roleSignal.set('MANAGER');
    fixture.detectChanges();
    expect(query('.admin-or-hr')).toBeNull();
  });
});
