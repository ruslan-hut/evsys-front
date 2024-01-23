import {Injectable, Optional} from '@angular/core';
import { Observable, retry, tap, timer} from "rxjs";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {environment} from "../../environments/environment";
import {WsMessage} from "../models/ws-message";
import {ErrorService} from "./error.service";
import {AccountService} from "./account.service";
import {WsRequest} from "../models/ws-request";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any>;
  private messages$: Observable<WsMessage>;

  private retryConfig = {
    count: 100,
    delay: this.retryObservable.bind(this),
    resetOnSuccess: true
  }

  constructor(
    private errorService: ErrorService,
    @Optional() private accountService?: AccountService
  ) { }

  connect(): void {
    this.socket$ = webSocket(environment.wsUrl);
    this.messages$ = this.socket$.pipe(
      retry(this.retryConfig)
    );
  }

  retryObservable(err: any, retryCount: number): Observable<any> {
    const timeout = retryCount * 2;
    console.log('Retrying websocket in '+timeout+' seconds...');
    return timer(timeout * 1000).pipe(
      tap(() => {this.errorService.handle('Websocket reconnecting...')})
    );
  }

  send(message: WsRequest): void {
    const user = this.accountService?.userValue;
    if (user && user.token) {
      message.token = user.token;
    }
    this.socket$.next(message);
  }

  receive(): Observable<WsMessage> {
    return this.messages$;
  }

  close(): void {
    this.socket$.complete();
  }
}
