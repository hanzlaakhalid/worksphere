import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { RejectLeaveDialog } from './reject-leave-dialog';

describe('RejectLeaveDialog', () => {
  let fixture: ComponentFixture<RejectLeaveDialog>;
  let component: RejectLeaveDialog;
  let dialogRefStub: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefStub = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RejectLeaveDialog],
      providers: [{ provide: MatDialogRef, useValue: dialogRefStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectLeaveDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not close when the reason is empty', () => {
    component['submit']();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('does not close when the reason is too short', () => {
    component['form'].controls.reviewNote.setValue('no');
    component['submit']();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('closes with the reason when valid', () => {
    component['form'].controls.reviewNote.setValue('Team is short-staffed that week.');
    component['submit']();
    expect(dialogRefStub.close).toHaveBeenCalledWith('Team is short-staffed that week.');
  });
});
