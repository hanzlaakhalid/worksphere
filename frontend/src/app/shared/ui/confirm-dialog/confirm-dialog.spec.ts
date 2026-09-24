import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let component: ConfirmDialog;
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefStub = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Delete employee', message: 'This cannot be undone.', danger: true },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the provided title and message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Delete employee');
    expect(el.textContent).toContain('This cannot be undone.');
  });

  it('closes with true on confirm', () => {
    component['confirm']();
    expect(dialogRefStub.close).toHaveBeenCalledWith(true);
  });

  it('closes with false on cancel', () => {
    component['cancel']();
    expect(dialogRefStub.close).toHaveBeenCalledWith(false);
  });
});
