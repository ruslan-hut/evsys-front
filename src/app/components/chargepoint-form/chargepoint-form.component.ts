import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, FormsModule} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import {ModalService} from "../../service/modal.service";
import { ActivatedRoute, Params, Router} from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";
import {TextFieldModule} from '@angular/cdk/text-field';


@Component({
  selector: 'app-chargepoint-form',
  templateUrl: './chargepoint-form.component.html',
  styleUrls: ['./chargepoint-form.component.css']
})
export class ChargepointFormComponent implements OnInit{

  chargePointId: string;
  chargePoint: Chargepoint;

  isSaved: boolean = false;
  constructor(
    private chargePointService: ChargepointService,
    private modalService: ModalService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
      this.chargePointService.init();
      this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
        this.chargePoint= chargePoint;
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
    });

    setTimeout(() => {
      this.isSaved = false;
    }, 3000);
  }

  close(){
    this.router.navigate(['/']);
  }

  onInputChange(event: any) {
    let input = event.target.value;

    input = input.replace(/[^0-9.]/g, '');

    const dotIndex = input.indexOf('.');
    if (dotIndex !== -1) {
      input = input.substr(0, dotIndex + 1) + input.substr(dotIndex + 1).replace(/\./g, '');
    }

    event.target.value = input;
  }
}
