import {Component, OnInit} from '@angular/core';
import {TariffService} from "../../service/tariff.service";
import {Tariff} from "../../models/tariff";

@Component({
  selector: 'app-tariff',
  templateUrl: './tariff.component.html',
  styleUrl: './tariff.component.css'
})
export class TariffComponent implements OnInit {

  tariffData: Tariff;

  displayedColumns: string[] = ["tariffID", "network", "country", "price"];

  constructor(
    private TariffService: TariffService,
  ) { }

  ngOnInit(): void {
    this.tariffData = this.TariffService.getTariff();
  }

  getUpdatedString(): string {
    return new Date(this.tariffData.data[0].last_updated).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  }

}
