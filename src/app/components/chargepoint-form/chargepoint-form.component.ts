import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import {ModalService} from "../../service/modal.service";
import { ActivatedRoute, Params } from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";


@Component({
  selector: 'app-chargepoint-form',
  templateUrl: './chargepoint-form.component.html',
  styleUrls: ['./chargepoint-form.component.css']
})
export class ChargepointFormComponent implements OnInit{

  chargePointId: number;
  chargePoint: Chargepoint;
  constructor(
    private chargePointService: ChargepointService,
    private modalService: ModalService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
    });
  }

  form = new FormGroup({
    title: new FormControl<string>("")
  })

  save() {
    // this.chargepointService.create({
    //   title: this.form.value as string,
    //   description: ""}).subscribe(() => this.modalService.close())
  }

  close(){

  }
}
