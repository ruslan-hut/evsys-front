import {Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import { MatSort, MatSortHeader } from "@angular/material/sort";
import {LogMessage} from "../../../models/log-message";
import { HttpClient } from "@angular/common/http";
import {environment} from "../../../../environments/environment";

import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-backlog',
    templateUrl: './backlog.component.html',
    styleUrls: ['./backlog.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatProgressBar, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow, MatPaginator]
})
export class BacklogComponent implements OnInit{
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  displayedColumn: string[] = ['time', 'level', 'category', 'text'];
  filter: string = "";
  loading = false;
  dataSource = new MatTableDataSource<LogMessage>();
  @ViewChild('logDataPaginator') set paginator(pager:MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter:MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  ngOnInit(): void {
    this.loading = true;
    this.http.get<LogMessage[]>(environment.apiUrl+environment.readBackLog).subscribe((messages) => {
      this.dataSource.data = messages;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  applyFilter(event: any) {
    this.filter = event;
    this.dataSource.filter = this.filter.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
