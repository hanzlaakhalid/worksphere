import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { DataTable } from './data-table';

interface Row {
  id: string;
  name: string;
}

@Component({
  imports: [DataTable, MatTableModule],
  template: `
    <app-data-table [loading]="loading" [empty]="rows.length === 0">
      <table mat-table [dataSource]="rows">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['name']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name']"></tr>
      </table>
    </app-data-table>
  `,
})
class HostComponent {
  rows: Row[] = [];
  loading = false;
}

describe('DataTable', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
  });

  it('shows the loading spinner while loading', () => {
    fixture.componentInstance.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading-spinner')).toBeTruthy();
  });

  it('shows the empty state when there are no rows', () => {
    fixture.componentInstance.rows = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('renders the projected table with one row per item once loaded', () => {
    fixture.componentInstance.rows = [
      { id: '1', name: 'Alex' },
      { id: '2', name: 'Sam' },
    ];
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('td.mat-column-name');
    expect(cells.length).toBe(2);
    expect(cells[0].textContent).toContain('Alex');
  });
});
