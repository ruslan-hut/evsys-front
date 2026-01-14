import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from '@angular/material/table';
import { LogMessage } from '../../../models/log-message';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-paylog',
  templateUrl: './paylog.component.html',
  styleUrls: ['./paylog.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBar,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatIconButton,
    MatSuffix,
    MatIcon,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatNoDataRow,
    MatPaginator,
    AsyncPipe,
    MatCard,
    MatCardContent
  ]
})
export class PaylogComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly cdr = inject(ChangeDetectorRef);

  displayedColumn: string[] = ['time', 'level', 'category', 'text'];
  filter: string = '';
  loading = false;
  dataSource = new MatTableDataSource<LogMessage>();

  // Mobile detection
  isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));

  @ViewChild('logDataPaginator') set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  ngOnInit(): void {
    this.loading = true;
    this.http.get<LogMessage[]>(environment.apiUrl + environment.readPayLog).subscribe((messages) => {
      this.dataSource.data = messages;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  applyFilter(event: any): void {
    this.filter = event;
    this.dataSource.filter = this.filter.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Get paginated and filtered data for mobile view
  get paginatedData(): LogMessage[] {
    const filtered = this.dataSource.filteredData;
    const paginator = this.dataSource.paginator;

    if (!paginator) {
      return filtered.slice(0, 10);
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(startIndex, startIndex + paginator.pageSize);
  }

  // Format time for mobile display (shorter format)
  formatTimeShort(timeStr: string): string {
    if (!timeStr) return '';
    // Assuming format like "2024-01-15 14:30:45"
    const parts = timeStr.split(' ');
    if (parts.length >= 2) {
      return parts[1]; // Return only time part
    }
    return timeStr;
  }

  // Format date for mobile display
  formatDateShort(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(' ');
    if (parts.length >= 1) {
      // Return date in shorter format MM-DD
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        return `${dateParts[1]}-${dateParts[2]}`;
      }
    }
    return timeStr;
  }

  // Get color for log level badge
  getLevelColor(level: string): string {
    switch (level) {
      case '!':
        return '#f44336'; // red
      case '?':
        return '#ffc107'; // yellow
      default:
        return '#757575'; // gray
    }
  }
}
