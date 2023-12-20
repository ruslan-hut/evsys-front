import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AccountService} from "../../../service/account.service";

declare var getInSiteFormJSON: any;
declare var storeIdOper: any;

@Component({
  selector: 'app-bank-service',
  templateUrl: './bank-service.component.html',
  styleUrls: ['./bank-service.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class BankServiceComponent implements OnInit {

  language: string = 'ES';
  authToken: string = '';
  token: string = '';
  errorCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.language = params['lng'];
      this.authToken = params['token'];
      if (this.authToken) {
        this.accountService.loginWithToken(this.authToken)
      }
    });
    this.setupEventListener();
    this.getInSiteForm();
  }

  merchantValidation(): boolean {
    alert("Operation completed");
    return true;
  }

  setupEventListener(): void {
    window.addEventListener("message", (event) => {
      storeIdOper(event, "token", "errorCode", this.merchantValidation);
    });
  }

  getInSiteForm() {
    const orderNumber = () => "ORD" + Math.floor((Math.random() * 1000) + 1);
    const formParamsJSON = {
      "id": "card-form",
      "fuc": "999008881",
      "terminal": "1",
      "order": orderNumber(),
      "idioma": this.language,
      "buttonValue": "Confirmar",
      "mostrarLogo": "true",
      "estiloReducido": "true",
      "estiloInsite": "twoRows"
    };
    getInSiteFormJSON(formParamsJSON);
  }

  showValues() {
    this.token = (document.getElementById("token") as HTMLInputElement).value;
    this.errorCode = (document.getElementById("errorCode") as HTMLInputElement).value;
    if (this.errorCode) {
      alert('Error: ' + this.errorCode);
    } else {
      alert('Token: ' + this.token);
    }
  }

}
