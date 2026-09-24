import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardCard } from './dashboard-card';

describe('DashboardCard', () => {
  let component: DashboardCard;
  let fixture: ComponentFixture<DashboardCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCard);
    fixture.componentRef.setInput('title', 'Employees');
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.title')?.textContent).toContain('Employees');
  });
});
