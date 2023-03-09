import {Component, OnInit} from '@angular/core';
import {Chargepoint} from "./models/chargepoint";
import {ChargepointService} from "./service/chargepoint.service";
import {Observable} from "rxjs";
import {ModalService} from "./service/modal.service";
import {Router} from "@angular/router";
import {ErrorService} from "./service/error.service";
import {LoggerService} from "./service/logger.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'EV-SYS Management Panel';

  chargepoints$: Observable<Chargepoint[]>;
  loading = false;
  filter = "";

  constructor(
    private router: Router,
    public logger: LoggerService,
    private chargepointService: ChargepointService,
    public modalService: ModalService,
    public errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
    this.logger.init();
    // this.loading = true
    // this.chargepoints$ = this.chargepointService.getAll().pipe(
    //   tap(() => this.loading = false)
    // )
  }

  navigateTo(destination: string) {
    this.router.navigateByUrl(destination).then(r => {
        if (!r) {
          this.errorService.handle("Failed to navigate: "+destination)
        }
      }
    );
  }
}
