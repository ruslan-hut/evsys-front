import { Component, OnInit, AfterContentInit, OnDestroy} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {MatTableDataSource} from "@angular/material/table";
import {Chargepoint} from "../../models/chargepoint";
import {Router} from "@angular/router";
import { MatCard } from '@angular/material/card';

import { MatFabButton } from '@angular/material/button';

@Component({
    selector: 'app-promo-list',
    templateUrl: './promo-list.component.html',
    styleUrls: ['./promo-list.component.css'],
    standalone: true,
    imports: [MatCard, MatFabButton]
})export class PromoListComponent implements OnInit, AfterContentInit, OnDestroy{
  loading = false;
  dataSource = new MatTableDataSource<Chargepoint>();
  constructor(
    private chargePointService: ChargepointService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.chargePointService.subscribeOnUpdates();
    this.chargePointService.getChargePoints().subscribe((chargePoints) => {
      this.dataSource.data = chargePoints;
    });
  }

  ngAfterContentInit(): void {
    const data = this.chargePointService.currentChargePoints();
    if (data.length != this.dataSource.data.length) {
      this.dataSource.data = data;
    }
    this.loading = false;
  }
  ngOnDestroy(): void {
    this.chargePointService.onStop();
  }

  selectChargePoint(chargePoint: Chargepoint){
    this.router.navigate(['/promo-point', { id: chargePoint.charge_point_id}]);
  }

}
