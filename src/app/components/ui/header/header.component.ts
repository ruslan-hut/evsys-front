import {Component, OnInit, AfterContentChecked, Optional} from '@angular/core';
import {Router} from "@angular/router";
import {ErrorService} from "../../../service/error.service";
import {AccountService} from "../../../service/account.service";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, AfterContentChecked{
  title = 'WattBrews';
  username = '';
  menuEnabled = false;

  isAdmin = false;

  constructor(
    private router: Router,
    public errorService: ErrorService,
    private accountService: AccountService,
  ) {
  }
  navigateTo(destination: string) {
    this.router.navigateByUrl(destination).then(r => {
        if (!r) {
          this.errorService.handle("Failed to navigate: "+destination)
        }
      }
    );
  }

  logout() {
    this.accountService.logout();
  }

  ngOnInit(): void {
    this.accountService.user.subscribe(user => {
      if (user) {
        if (user.name) {
          this.username = user.name;
        } else {
          this.username = user.username;
        }
        this.isAdmin = user.role === environment.admin;
      } else {
        this.username = '';
      }
    });
  }

  ngAfterContentChecked(): void {
    this.menuEnabled = !this.router.url.includes('/points-form');
  }
}
