import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {environment} from "../../environments/environment";
import {WsMessage} from "../models/ws-message";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private webSocketSubject: WebSocketSubject<any>;

  constructor() { }

  connect(): void {
    this.webSocketSubject = webSocket(environment.wsUrl);
  }

  send(message: any): void {
    this.webSocketSubject.next(message);
  }

  receive(): Observable<WsMessage> {
    return this.webSocketSubject.asObservable();
  }
}
