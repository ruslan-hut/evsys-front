import { Component } from '@angular/core';
import {ErrorService} from "../../service/error.service";
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-global-error',
    templateUrl: './global-error.component.html',
    styleUrls: ['./global-error.component.css'],
    standalone: true,
    imports: [AsyncPipe]
})
export class GlobalErrorComponent {

  constructor(public errorService: ErrorService) {
  }

}
