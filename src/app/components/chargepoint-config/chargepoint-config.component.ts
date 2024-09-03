import {Component, OnInit} from '@angular/core';
import {Chargepoint} from "../../models/chargepoint";
import {ChargepointService} from "../../service/chargepoint.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {FormControl, FormGroup} from "@angular/forms";
import {ConfigKey, CsConfigResponse} from "../../models/cs-config-response";
import {CsResponse} from "../../models/cs-response";
import {MatTableDataSource} from "@angular/material/table";
import {ErrorService} from "../../service/error.service";
import {AccountService} from "../../service/account.service";

@Component({
  selector: 'app-chargepoint-config',
  templateUrl: './chargepoint-config.component.html',
  styleUrls: ['./chargepoint-config.component.css']
})
export class ChargepointConfigComponent implements OnInit {
  chargePointId: string;
  chargePoint: Chargepoint;
  chargePointConfig: CsConfigResponse;
  displayedColumns: string[] = ['key', 'value', 'actions'];
  dataSource: MatTableDataSource<ConfigKey>;

  loading: boolean = true;
  constructor(
    private chargePointService: ChargepointService,
    private route: ActivatedRoute,
    private router: Router,
    private errorService: ErrorService,
    public accountService: AccountService
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
      this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
        this.chargePoint= chargePoint;
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
      });
    }
  }

  close(){
    this.router.navigate(['/']);
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

}
