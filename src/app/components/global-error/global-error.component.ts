import { Component } from '@angular/core';
import {ErrorService} from "../../service/error.service";

@Component({
  selector: 'app-global-error',
  templateUrl: './global-error.component.html',
  styleUrls: ['./global-error.component.css']
})
export class GlobalErrorComponent {

  constructor(public errorService: ErrorService) {
  }

}
