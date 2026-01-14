import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {Chargepoint} from "../../models/chargepoint";
import {ChargepointService} from "../../service/chargepoint.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {FormControl, FormGroup} from "@angular/forms";
import {ConfigKey, CsConfigResponse} from "../../models/cs-config-response";
import {CsResponse} from "../../models/cs-response";
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from "@angular/material/table";
import {ErrorService} from "../../service/error.service";
import {AccountService} from "../../service/account.service";

import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-chargepoint-config',
    templateUrl: './chargepoint-config.component.html',
    styleUrls: ['./chargepoint-config.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatProgressSpinner, MatInput, MatButton, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatProgressBar, MatCardActions, MatIcon]
})
export class ChargepointConfigComponent implements OnInit {
  private readonly chargePointService = inject(ChargepointService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorService = inject(ErrorService);
  readonly accountService = inject(AccountService);
  private readonly cdr = inject(ChangeDetectorRef);

  chargePointId!: string;
  chargePoint!: Chargepoint;
  chargePointConfig!: CsConfigResponse;
  displayedColumns: string[] = ['key', 'value', 'actions'];
  dataSource!: MatTableDataSource<ConfigKey>;

  loading: boolean = true;
  expandedKey: string | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
      this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
        this.chargePoint = chargePoint;
        this.cdr.markForCheck();
        this.reload();
      });
    });
    window.scrollTo(0, 0);
  }

  form = new FormGroup({
    title: new FormControl<string>("")
  })

  submit(key: string, value: string) {
    const configurationKey: ConfigKey = {
      key: key,
      value: value,
    };

    if (this.chargePoint.charge_point_id != null) {
      this.setLoadingForKey(key, true);
      this.chargePointService.sendCsCommand(this.chargePoint.charge_point_id, 0, "ChangeConfiguration", JSON.stringify(configurationKey)).subscribe((config) => {

        const resp = (JSON.parse(config.info) as CsResponse).status;

        if(resp == "Accepted" && config.status == 'success'){
          this.setValueForKey(key, value)
          this.dataSource = new MatTableDataSource(this.chargePointConfig.configurationKey);
        }else{
          this.errorService.handle(resp);
        }

        this.setLoadingForKey(key, false);
        this.cdr.markForCheck();
      });
    }
  }

  reload(){
    this.loading = true;
    if (this.chargePoint.charge_point_id != null) {
      this.chargePointService.sendCsCommand(this.chargePoint.charge_point_id, 0, "GetConfiguration", "").subscribe((config) => {
        this.chargePointConfig = JSON.parse(config.info) as CsConfigResponse;
        this.dataSource = new MatTableDataSource(this.chargePointConfig.configurationKey);
        this.loading = false;
        this.cdr.markForCheck();
      });
    }
  }

  close(){
    this.router.navigate(['/points']);
  }

  setValueForKey(keyToUpdate: string, newValue: string): void {
    const index = this.chargePointConfig.configurationKey.findIndex(configKey => configKey.key === keyToUpdate);

    if (index !== -1) {
      this.chargePointConfig.configurationKey[index].value = newValue;
    } else {
      console.error(`Key ${keyToUpdate} not found.`);
    }
  }

  setLoadingForKey(keyToUpdate: string, loading: boolean): void {
    const index = this.chargePointConfig.configurationKey.findIndex(configKey => configKey.key === keyToUpdate);

    if (index !== -1) {
      this.chargePointConfig.configurationKey[index].loading = loading;
    } else {
      console.error(`Key ${keyToUpdate} not found.`);
    }
  }

  toggleExpand(key: string): void {
    this.expandedKey = this.expandedKey === key ? null : key;
  }
}
