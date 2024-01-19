import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {User} from "../../../models/user";
import {AccountService} from "../../../service/account.service";
import {MatDialog} from "@angular/material/dialog";
import {UserInfoComponent} from "../user-info/user-info.component";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  //displayedColumn: string[] = ['username', 'name', 'role', 'level', 'plan', 'registered', 'last_seen', 'actions'];
  displayedColumn: string[] = ['username', 'name', 'last_seen', 'actions'];
  filter: string = "";
  loading = false;
  dataSource = new MatTableDataSource<User>();
  showFirstLastButtons = true;
  @ViewChild('logDataPaginator') set paginator(pager:MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter:MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  constructor(
    public account: AccountService,
    public dialog: MatDialog
    ) {}

  ngOnInit(): void {
    this.loading = true;
    this.account.getAll().subscribe((users) => {
      this.dataSource.data = users;
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

  openUserInfo(username: string) {
    this.dialog.open(UserInfoComponent, {
      width: '400px',
      data: username,
    });
  }


}
