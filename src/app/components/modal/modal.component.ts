import {Component, Input} from '@angular/core';
import {ModalService} from "../../service/modal.service";

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css'],
    standalone: true
})
export class ModalComponent {

  @Input() title: string

  constructor(public modalService: ModalService) {
  }

}
