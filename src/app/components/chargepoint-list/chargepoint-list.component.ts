import {AfterContentInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {MatTableDataSource} from "@angular/material/table";
import {Chargepoint} from "../../models/chargepoint";
import {LocalStorageService} from "../../service/local-storage.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css']
})
export class ChargepointListComponent implements OnInit, AfterContentInit, OnDestroy {

  loading = false;
  dataSource = new MatTableDataSource<Chargepoint>();

  constructor(
    private chargepointService: ChargepointService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.redirectToChargePointScreen();
    this.loading = true;
    this.chargepointService.subscribeOnUpdates();
    this.chargepointService.getChargePoints().subscribe((chargePoints) => {
      this.dataSource.data = chargePoints;
    });
  }

  ngAfterContentInit(): void {
    const data = this.chargepointService.currentChargePoints();
    if (data.length != this.dataSource.data.length) {
      this.dataSource.data = data;
    }
    this.loading = false;
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
