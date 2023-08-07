import {Component, OnInit} from '@angular/core';

declare var getInSiteFormJSON: any;
declare var storeIdOper: any;

@Component({
  selector: 'app-bank-service',
  templateUrl: './bank-service.component.html',
  styleUrls: ['./bank-service.component.css']
})
export class BankServiceComponent implements OnInit {

  token: string = '';
  errorCode: string = '';

  constructor() { }

  ngOnInit(): void {
    this.setupEventListener();
    this.getInSiteForm();
  }

  merchantValidation(): boolean {
    alert("Got the operation result");
    //alert(this.token + '--' + this.errorCode);
    return true;
  }

  setupEventListener(): void {
    window.addEventListener("message", (event) => {
      //console.log("event", event)
      //console.log(storeIdOper);
      storeIdOper(event, "token", "errorCode", this.merchantValidation);
    });
  }

  getInSiteForm() {
    const orderNumber = () => "ORD" + Math.floor((Math.random() * 1000) + 1);
    const insiteJSON = {
      "id": "card-form",
      "fuc": "999008881",
      "terminal": "1",
      "order": orderNumber(),
      "mostrarLogo": "true",
      "estiloReducido": "true",
      "estiloInsite": "twoRows"
    };
    getInSiteFormJSON(insiteJSON);
  }

  showValues() {
    this.token = (document.getElementById("token") as HTMLInputElement).value;
    this.errorCode = (document.getElementById("errorCode") as HTMLInputElement).value;
    alert(this.token + '--' + this.errorCode);
  }

}
