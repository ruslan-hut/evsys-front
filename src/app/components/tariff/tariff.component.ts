import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import {TariffService} from "../../service/tariff.service";
import {Tariff} from "../../models/tariff";
import { CurrencyPipe } from '@angular/common';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';

@Component({
    selector: 'app-tariff',
    templateUrl: './tariff.component.html',
    styleUrl: './tariff.component.css',
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, CurrencyPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TariffComponent implements OnInit {
  private readonly tariffService = inject(TariffService);

  tariffData!: Tariff;

  displayedColumns: string[] = ["tariffID", "network", "country", "price"];

  ngOnInit(): void {
    this.tariffData = this.tariffService.getTariff();
  }

  getUpdatedString(): string {
    return new Date(this.tariffData.data[0].last_updated).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  }

}
