import { Component, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Consistent header/content/actions chrome for dialogs opened via MatDialog.
 * Composed inside a dialog component's own template, e.g.:
 *   <app-modal title="New Department">
 *     <form ...>...</form>
 *     <div modalActions>
 *       <button mat-button (click)="close()">Cancel</button>
 *       <button mat-flat-button type="submit">Save</button>
 *     </div>
 *   </app-modal>
 */
@Component({
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  selector: 'app-modal',
  styleUrl: './modal.scss',
  templateUrl: './modal.html',
})
export class Modal {
  readonly title = input.required<string>();
}
