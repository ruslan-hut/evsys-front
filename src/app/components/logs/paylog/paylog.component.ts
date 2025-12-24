import {Component, OnInit, ViewChild} from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from "@angular/material/table";
import {LogMessage} from "../../../models/log-message";
import {MatPaginator} from "@angular/material/paginator";
import { MatSort, MatSortHeader } from "@angular/material/sort";
import { HttpClient } from "@angular/common/http";
import {environment} from "../../../../environments/environment";

import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-paylog',
    templateUrl: './paylog.component.html',
    styleUrls: ['./paylog.component.css'],
    standalone: true,
    imports: [MatProgressBar, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow, MatPaginator]
})
export class PaylogComponent implements OnInit{
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

  constructor(private http: HttpClient) {

  }
  ngOnInit(): void {
    this.loading = true;
    this.http.get<LogMessage[]>(environment.apiUrl+environment.readPayLog).subscribe((messages) => {
      this.dataSource.data = messages;
      this.loading = false;
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
