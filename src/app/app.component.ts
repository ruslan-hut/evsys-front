import {Component, OnInit} from '@angular/core';
import {ChargepointService} from "./service/chargepoint.service";
import {Router} from "@angular/router";
import {ErrorService} from "./service/error.service";
import {LoggerService} from "./service/logger.service";
import {AccountService} from "./service/account.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'EV-SYS';
  username = '';

  constructor(
    private router: Router,
    public logger: LoggerService,
    private chargepointService: ChargepointService,
    public errorService: ErrorService,
    private accountService: AccountService
  ) {
  }

  ngOnInit(): void {
    if (!this.accountService.userValue) {
      this.navigateTo('/account/login');
    } else {
      this.logger.init();
    }
    this.accountService.user.subscribe(user => {
      if (user) {
        this.username = user.username;
      } else {
        this.username = '';
      }
    });
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
    //this.username = '';
    this.accountService.logout();
    //this.navigateTo('/account/login');
  }
}
