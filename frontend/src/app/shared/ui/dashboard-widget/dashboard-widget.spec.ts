import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DashboardWidget } from './dashboard-widget';

@Component({
  imports: [DashboardWidget],
  template: `
    <app-dashboard-widget title="Test Widget" [loading]="loading" [empty]="empty" emptyMessage="Nothing here">
      <div class="content-marker">content</div>
    </app-dashboard-widget>
  `,
})
class HostComponent {
  loading = false;
  empty = false;
}

describe('DashboardWidget', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('shows a loading skeleton and hides content while loading', () => {
    host.loading = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.widget-skeleton')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.content-marker')).toBeFalsy();
  });

  it('shows the empty message when empty and not loading', () => {
    host.empty = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.widget-empty')?.textContent).toContain('Nothing here');
    expect(fixture.nativeElement.querySelector('.content-marker')).toBeFalsy();
  });

  it('projects content once loaded and non-empty', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.content-marker')).toBeTruthy();
  });

  it('renders the title', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.widget-title')?.textContent).toContain('Test Widget');
  });
});
