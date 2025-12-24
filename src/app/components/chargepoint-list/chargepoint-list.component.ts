import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe } from "@angular/common";
import { ChargepointService } from "../../service/chargepoint.service";
import { MatTableDataSource } from "@angular/material/table";
import { Chargepoint } from "../../models/chargepoint";
import { LocalStorageService } from "../../service/local-storage.service";
import { Router } from "@angular/router";

import { ChargepointComponent } from '../chargepoint/chargepoint.component';

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css'],
  standalone: true,
  imports: [ChargepointComponent, AsyncPipe]
})
export class ChargepointListComponent implements OnInit, OnDestroy {

  chargePoints$ = this.chargepointService.getChargePoints();

  constructor(
    private chargepointService: ChargepointService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.redirectToChargePointScreen();
    this.chargepointService.subscribeOnUpdates();
  }




  ngOnDestroy(): void {
    this.chargepointService.onStop();
  }

  redirectToChargePointScreen(): void {
    const redirectUrl = this.localStorageService.getRedirectUrl();
    if (redirectUrl) {
      this.router.navigate(['new-transactions'], {
        queryParams: { charge_point_id: redirectUrl.charge_point_id, connector_id: redirectUrl.connector_id }
      });
    }
  }

}
