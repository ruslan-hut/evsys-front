import { Injectable } from '@angular/core';
import {AnonymousSubject} from "rxjs/internal/Subject";
import {map, Observable, Observer, Subject} from "rxjs";
import {WsMessage} from "../models/ws-message";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private subject: AnonymousSubject<MessageEvent>;
  public messages: Subject<WsMessage>;

  constructor() {
    this.messages = <Subject<WsMessage>>this.connect(environment.wsUrl).pipe(
      map(
      (response: MessageEvent): WsMessage => {
        let data = JSON.parse(response.data);
        return {
          source: data.source,
          content: data.content
        };
      })
    );
  }

  public connect(url: string): AnonymousSubject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log("Successfully connected: " + url);
    }
    return this.subject;
  }

  private create(url: string): AnonymousSubject<MessageEvent> {
    let ws = new WebSocket(url);
    let observable = new Observable((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });
    let observer = {
      error: null,
      complete: null,
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    }
    // @ts-ignore
    return new AnonymousSubject<MessageEvent>(observer, observable);
  }
}
