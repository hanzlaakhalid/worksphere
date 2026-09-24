import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Modal } from './modal';

describe('Modal', () => {
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
      providers: [{ provide: MatDialogRef, useValue: { close: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('title', 'New Department');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('New Department');
  });
});
