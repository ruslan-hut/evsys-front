import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {ErrorService} from "../../../service/error.service";
import {AccountService} from "../../../service/account.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit{
  title = 'WattBrews';
  username = '';

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
      } else {
        this.username = '';
      }
    });
  }
}
