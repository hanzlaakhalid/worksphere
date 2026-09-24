import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Modal } from '../../../shared/ui/modal/modal';

@Component({
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, Modal],
  selector: 'app-reject-leave-dialog',
  styleUrl: './reject-leave-dialog.scss',
  templateUrl: './reject-leave-dialog.html',
})
export class RejectLeaveDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RejectLeaveDialog>);

  protected readonly form = this.fb.nonNullable.group({
    reviewNote: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue().reviewNote);
  }
}
