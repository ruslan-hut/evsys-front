import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule } from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import { ActivatedRoute, Params, Router} from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";

import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ConnectorFormComponent } from '../connector-form/connector-form.component';
import { MatButton } from '@angular/material/button';
import { SortConnectorsPipe } from '../pipes/sortConnectorsPipe';

@Component({
    selector: 'app-chargepoint-form',
    templateUrl: './chargepoint-form.component.html',
    styleUrls: ['./chargepoint-form.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatIcon, MatCardContent, FormsModule, MatInput, CdkTextareaAutosize, ConnectorFormComponent, MatCardActions, MatButton, SortConnectorsPipe]
})
export class ChargepointFormComponent implements OnInit {
  private readonly chargePointService = inject(ChargepointService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  chargePointId!: string;
  chargePoint!: Chargepoint;

  isSaved: boolean = false;

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
      this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
        this.chargePoint = chargePoint;
        this.cdr.markForCheck();
      });
    });
    window.scrollTo(0, 0);
  }

  form = new FormGroup({
    title: new FormControl<string>("")
  })

  save() {
    this.chargePointService.postChargePoint(this.chargePoint).subscribe((chargePoint) => {
      this.chargePoint = chargePoint;
      this.isSaved = true;
      this.cdr.markForCheck();
    });

    setTimeout(() => {
      this.isSaved = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  close(){
    this.router.navigate(['/points']);
  }

}
