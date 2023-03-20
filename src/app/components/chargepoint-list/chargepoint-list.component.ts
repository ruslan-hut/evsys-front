import {Component, OnInit} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {Chargepoint} from "../../models/chargepoint";
import {Observable} from "rxjs";

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css']
})
export class ChargepointListComponent implements OnInit{

  chargepoints$: Observable<Chargepoint[]>;

  constructor(
    private chargepointService: ChargepointService,
  ) { }

  ngOnInit(): void {
    this.chargepoints$ = this.chargepointService.getAll();
  }
}
