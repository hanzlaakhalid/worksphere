import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  let component: Pagination;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Pagination] }).compileComponents();
    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('total', 45);
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('pageSize', 20);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('converts mat-paginator 0-indexed pageIndex to a 1-indexed page on emit', () => {
    const emitted: { page: number; pageSize: number }[] = [];
    component.pageChange.subscribe((v) => emitted.push(v));

    component['onPage']({ pageIndex: 0, pageSize: 20, length: 45 } as PageEvent);

    expect(emitted).toEqual([{ page: 1, pageSize: 20 }]);
  });
});
