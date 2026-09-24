import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  let fixture: ComponentFixture<StatusBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', 'ON_LEAVE');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the human-readable label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('On Leave');
  });

  it('applies the matching color class', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.status-on-leave')).toBeTruthy();
  });
});
