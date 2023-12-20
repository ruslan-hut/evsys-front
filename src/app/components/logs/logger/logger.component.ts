import {AfterContentInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {Message} from "../../../models/message";
import {LoggerService} from "../../../service/logger.service";

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css']
})
export class LoggerComponent implements OnInit, AfterContentInit, OnDestroy {
  displayedColumn: string[] = ['time', 'feature', 'id', 'text'];
  filter: string = "";
  loading = false;
  dataSource = new MatTableDataSource<Message>();
  @ViewChild('logDataPaginator') set paginator(pager:MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter:MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  constructor(
    public logger: LoggerService
    ) {}

  ngOnInit(): void {
    this.loading = true;
    this.logger.init();
    this.logger.getMessages().subscribe((messages) => {
      this.dataSource.data = messages;
    });
  }

  ngAfterContentInit(): void {
    const data = this.logger.currentMessages();
    if (data.length != this.dataSource.data.length) {
      this.dataSource.data = data;
    }
    this.loading = false;
  }

  applyFilter(event: any) {
    this.filter = event;
    this.dataSource.filter = this.filter.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.logger.onStop();
  }

}
