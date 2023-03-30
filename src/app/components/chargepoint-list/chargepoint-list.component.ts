import {Component, OnDestroy, OnInit} from '@angular/core';
import {ChargepointService} from "../../service/chargepoint.service";
import {Chargepoint} from "../../models/chargepoint";
import {map, Observable} from "rxjs";
import {WebsocketService} from "../../service/websocket.service";
import {WsMessage} from "../../models/ws-message";

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css']
})
export class ChargepointListComponent implements OnInit, OnDestroy{

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
      const updated: Chargepoint = JSON.parse(message.data);
      console.log('Updated: ', updated.charge_point_id);
      this.chargepoints$ = this.chargepoints$.pipe(
        map(chargepoints => chargepoints.map(chargepoint => {
          if (chargepoint.charge_point_id === updated.charge_point_id) {
            return updated;
          }
          return chargepoint;
        })));
      this.messages.push(message);
    });
  }

  send(): void {
    this.websocketService.send('Hello from client!');
  }

  ngOnDestroy(): void {
    this.websocketService.close();
  }
}
