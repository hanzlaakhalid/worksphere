import { Component, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Reusable debounced search box. Demonstrates the classic
 * Subject -> debounceTime -> distinctUntilChanged pipeline at the
 * component boundary; the parent (e.g. EmployeeList) owns the
 * switchMap -> HTTP call that reacts to `searchChange`.
 */
@Component({
  imports: [MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule],
  selector: 'app-search-input',
  styleUrl: './search-input.scss',
  templateUrl: './search-input.html',
})
export class SearchInput {
  readonly placeholder = input('Search...');
  readonly debounceMs = input(300);

  readonly searchChange = output<string>();

  protected readonly value = signal('');
  private readonly input$ = new Subject<string>();

  constructor() {
    this.input$
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.searchChange.emit(value));
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.input$.next(value);
  }

  protected clear(): void {
    this.value.set('');
    this.input$.next('');
  }
}
