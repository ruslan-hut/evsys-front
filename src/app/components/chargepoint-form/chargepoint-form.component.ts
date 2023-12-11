import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, FormsModule} from "@angular/forms";
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

  chargePointId: string;
  chargePoint: Chargepoint;
  constructor(
    private chargePointService: ChargepointService,
    private modalService: ModalService,
    private route: ActivatedRoute
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

  onInputChange(event: any) {
    let input = event.target.value;

    input = input.replace(/[^0-9.]/g, '');

    const dotIndex = input.indexOf('.');
    if (dotIndex !== -1) {
      input = input.substr(0, dotIndex + 1) + input.substr(dotIndex + 1).replace(/\./g, '');
    }

    event.target.value = input;
  }

  onInputMouseDown(event: MouseEvent): void {
    event.preventDefault();
  }
  adjustTextareaHeight() {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }
}
