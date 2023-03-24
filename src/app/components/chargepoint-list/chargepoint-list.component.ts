import {Component, OnInit} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {Chargepoint} from "../../models/chargepoint";
import {Observable} from "rxjs";
import {WebsocketService} from "../../service/websocket.service";
import {WsMessage} from "../../models/ws-message";

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css']
})
export class ChargepointListComponent implements OnInit{

  chargepoints$: Observable<Chargepoint[]>;
  messages: WsMessage[] = [];

  constructor(
    private chargepointService: ChargepointService,
    private websocketService: WebsocketService
  ) { }

  ngOnInit(): void {
    this.chargepoints$ = this.chargepointService.getAll();
    this.websocketService.connect();
    this.websocketService.receive().subscribe(message => {
      console.log('Received message: ' + message.topic + ' ' + message.data);
      this.messages.push(message);
    });
  }

  send(): void {
    this.websocketService.send('Hello from client!');
  }
}
