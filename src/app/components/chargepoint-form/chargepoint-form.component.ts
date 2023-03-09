import { Component } from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import {ModalService} from "../../service/modal.service";

@Component({
  selector: 'app-chargepoint-form',
  templateUrl: './chargepoint-form.component.html',
  styleUrls: ['./chargepoint-form.component.css']
})
export class ChargepointFormComponent {

  constructor(
    private chargepointService: ChargepointService,
    private modalService: ModalService
  ) {
  }

  form = new FormGroup({
    title: new FormControl<string>("")
  })

  submit() {
    // this.chargepointService.create({
    //   title: this.form.value as string,
    //   description: ""}).subscribe(() => this.modalService.close())
  }
}
