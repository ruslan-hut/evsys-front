import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {LogMessage} from "../../../models/log-message";
import { HttpClient } from "@angular/common/http";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.css']
})
export class BacklogComponent implements OnInit{
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
    this.http.get<LogMessage[]>(environment.apiUrl+environment.readBackLog).subscribe((messages) => {
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
