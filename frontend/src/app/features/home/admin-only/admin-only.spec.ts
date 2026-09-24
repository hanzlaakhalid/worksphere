import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminOnly } from './admin-only';

describe('AdminOnly', () => {
  let component: AdminOnly;
  let fixture: ComponentFixture<AdminOnly>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOnly],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOnly);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
