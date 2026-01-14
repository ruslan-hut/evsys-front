import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { User } from '../../../models/user';
import { AccountService } from '../../../service/account.service';
import { MatDialog } from '@angular/material/dialog';
import { UserInfoComponent } from '../user-info/user-info.component';
import { BasicDialogComponent } from '../../dialogs/basic/basic-dialog.component';
import { DialogData } from '../../../models/dialog-data';
import { ErrorService } from '../../../service/error.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBar,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatIconButton,
    MatButton,
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
    RouterLink,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatNoDataRow,
    MatPaginator,
    AsyncPipe,
    MatExpansionModule
  ]
})
export class UsersComponent implements OnInit {
  readonly account = inject(AccountService);
  readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly errorService = inject(ErrorService);
  private readonly cdr = inject(ChangeDetectorRef);

  displayedColumn: string[] = ['username', 'name', 'last_seen', 'actions'];
  filter: string = '';
  loading = false;
  dataSource = new MatTableDataSource<User>();
  showFirstLastButtons = true;

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
    this.account.getAll().subscribe((users) => {
      this.dataSource.data = users;
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

  openUserInfo(username: string): void {
    this.dialog.open(UserInfoComponent, {
      width: '100%',
      maxWidth: '400px',
      data: username,
    });
  }

  // Get paginated and filtered data for mobile view
  get paginatedData(): User[] {
    const filtered = this.dataSource.filteredData;
    const paginator = this.dataSource.paginator;

    if (!paginator) {
      return filtered.slice(0, 10);
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(startIndex, startIndex + paginator.pageSize);
  }

  // Format last seen for mobile display
  formatLastSeen(dateStr: string | undefined): string {
    if (!dateStr) return 'Never';
    // Return shorter format
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      return parts[0]; // Return only date part
    }
    return dateStr;
  }

  deleteUser(username: string): void {
    const dialogData: DialogData = {
      title: 'Delete User',
      content: `Are you sure you want to delete user "${username}"?`,
      buttonYes: 'Delete',
      buttonNo: 'Cancel',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '300px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.account.deleteUser(username).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(u => u.username !== username);
            this.cdr.markForCheck();
          },
          error: () => {
            this.errorService.handle('Failed to delete user');
          }
        });
      }
    });
  }
}
