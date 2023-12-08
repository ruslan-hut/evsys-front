import {AfterContentInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {MatTableDataSource} from "@angular/material/table";
import {Chargepoint} from "../../models/chargepoint";
import {Observable} from "rxjs";

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css']
})
export class ChargepointListComponent implements OnInit, AfterContentInit, OnDestroy {

  chargepoints$: Observable<Chargepoint[]>;
  loading = false;

  dataSource = new MatTableDataSource<Chargepoint>();

  constructor(
    private chargepointService: ChargepointService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.chargepointService.init();
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

}
