import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInput } from './search-input';

describe('SearchInput', () => {
  let fixture: ComponentFixture<SearchInput>;
  let component: SearchInput;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [SearchInput] }).compileComponents();
    fixture = TestBed.createComponent(SearchInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function typeInto(value: string): void {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not emit before the debounce window elapses', () => {
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    typeInto('si');
    vi.advanceTimersByTime(200);

    expect(emitted).toEqual([]);
  });

  it('emits the debounced value once typing settles', () => {
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    typeInto('silv');
    vi.advanceTimersByTime(100);
    typeInto('silva');
    vi.advanceTimersByTime(300);

    expect(emitted).toEqual(['silva']);
  });

  it('does not re-emit for the same value twice in a row (distinctUntilChanged)', () => {
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    typeInto('silva');
    vi.advanceTimersByTime(300);
    typeInto('silva');
    vi.advanceTimersByTime(300);

    expect(emitted).toEqual(['silva']);
  });

  it('emits an empty string when cleared', () => {
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    typeInto('silva');
    vi.advanceTimersByTime(300);
    component['clear']();
    vi.advanceTimersByTime(300);

    expect(emitted).toEqual(['silva', '']);
  });
});
