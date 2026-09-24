import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  imports: [MatProgressSpinnerModule],
  selector: 'app-loading-spinner',
  styleUrl: './loading-spinner.scss',
  templateUrl: './loading-spinner.html',
})
export class LoadingSpinner {
  readonly message = input<string>();
  readonly diameter = input(40);
  readonly inline = input(false);
}
