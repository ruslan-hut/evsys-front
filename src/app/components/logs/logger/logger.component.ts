import { AfterContentInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { Message } from '../../../models/message';
import { LoggerService } from '../../../service/logger.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css'],
  standalone: true,
  imports: [MatProgressBar, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow, MatPaginator]
})
export class LoggerComponent implements OnInit, AfterContentInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumn: string[] = ['time', 'feature', 'id', 'text'];
  filter: string = '';
  loading = false;
  dataSource = new MatTableDataSource<Message>();
  isOnline = false;

  @ViewChild('logDataPaginator') set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  constructor(public logger: LoggerService) {}

  ngOnInit(): void {
    this.loading = true;
    this.logger.subscribeOnUpdates();

    this.logger.getMessages().pipe(
      takeUntil(this.destroy$)
    ).subscribe((messages) => {
      this.dataSource.data = messages;
      this.loading = false;
    });

    this.logger.isOnline$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.isOnline = status;
    });
  }

  ngAfterContentInit(): void {
    const data = this.logger.currentMessages();
    if (data.length !== this.dataSource.data.length) {
      this.dataSource.data = data;
      this.loading = false;
    }
  }

  applyFilter(event: any): void {
    this.filter = event;
    this.dataSource.filter = this.filter.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.onStop();
  }
}
