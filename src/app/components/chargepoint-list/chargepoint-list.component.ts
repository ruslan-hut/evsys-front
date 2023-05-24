import {Component, OnDestroy, OnInit} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {Chargepoint} from "../../models/chargepoint";
import {Observable} from "rxjs";

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css']
})
export class ChargepointListComponent implements OnInit, OnDestroy {

  chargepoints$: Observable<Chargepoint[]>;

  constructor(
    private chargepointService: ChargepointService
  ) { }

  ngOnInit(): void {
    this.chargepointService.init();
    this.chargepoints$ = this.chargepointService.chargePoints$;
  }

  ngOnDestroy(): void {
    this.chargepointService.onStop();
  }

}
