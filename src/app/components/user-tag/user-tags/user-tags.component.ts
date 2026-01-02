import {Component, OnInit, ViewChild} from '@angular/core';
import {map} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatDialog} from '@angular/material/dialog';
import {BasicDialogComponent} from '../../dialogs/basic/basic-dialog.component';
import {DialogData} from '../../../models/dialog-data';
import {ErrorService} from '../../../service/error.service';
import {UserTagService} from '../../../service/user-tag.service';
import {UserTag} from '../../../models/user-tag';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatIconButton, MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {AsyncPipe} from '@angular/common';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatChip} from '@angular/material/chips';

@Component({
  selector: 'app-user-tags',
  templateUrl: './user-tags.component.html',
  styleUrls: ['./user-tags.component.css'],
  standalone: true,
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
    MatExpansionModule,
    MatChip
  ]
})
export class UserTagsComponent implements OnInit {
  displayedColumns: string[] = ['id_tag', 'username', 'source', 'is_enabled', 'last_seen', 'actions'];
  filter: string = '';
  loading = false;
  dataSource = new MatTableDataSource<UserTag>();
  showFirstLastButtons = true;

  isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));

  @ViewChild('tagDataPaginator') set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  constructor(
    private userTagService: UserTagService,
    public dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.loading = true;
    this.userTagService.getAll().subscribe({
      next: (tags) => {
        this.dataSource.data = tags;
        this.loading = false;
      },
      error: () => {
        this.errorService.handle('Failed to load user tags');
        this.loading = false;
      }
    });
  }

  applyFilter(event: any): void {
    this.filter = event;
    this.dataSource.filter = this.filter.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  get paginatedData(): UserTag[] {
    const filtered = this.dataSource.filteredData;
    const paginator = this.dataSource.paginator;

    if (!paginator) {
      return filtered.slice(0, 10);
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(startIndex, startIndex + paginator.pageSize);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'Never';
    const parts = dateStr.split('T');
    if (parts.length >= 1) {
      return parts[0];
    }
    return dateStr;
  }

  deleteTag(idTag: string): void {
    const dialogData: DialogData = {
      title: 'Delete Tag',
      content: `Are you sure you want to delete tag "${idTag}"?`,
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
        this.userTagService.delete(idTag).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(t => t.id_tag !== idTag);
          },
          error: () => {
            this.errorService.handle('Failed to delete tag');
          }
        });
      }
    });
  }
}
