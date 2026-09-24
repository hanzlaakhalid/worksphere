import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { EmptyState } from '../../ui/empty-state/empty-state';

/** Generic placeholder for routes that exist but whose feature module isn't built yet. */
@Component({
  imports: [EmptyState],
  selector: 'app-coming-soon',
  styleUrl: './coming-soon.scss',
  templateUrl: './coming-soon.html',
})
export class ComingSoon {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string) ?? 'Coming soon')),
    { initialValue: 'Coming soon' },
  );
}
