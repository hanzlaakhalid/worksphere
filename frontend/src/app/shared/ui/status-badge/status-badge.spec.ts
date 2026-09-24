import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  let fixture: ComponentFixture<StatusBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('label', 'On Leave');
    fixture.componentRef.setInput('variant', 'warning');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the given label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('On Leave');
  });

  it('applies the matching variant class', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.variant-warning')).toBeTruthy();
  });

  it('defaults to the neutral variant when none is bound', () => {
    const freshFixture = TestBed.createComponent(StatusBadge);
    freshFixture.componentRef.setInput('label', 'Draft');
    freshFixture.detectChanges();
    const el = freshFixture.nativeElement as HTMLElement;
    expect(el.querySelector('.variant-neutral')).toBeTruthy();
  });
});
