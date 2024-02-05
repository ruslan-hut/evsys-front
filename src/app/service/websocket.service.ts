import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, Subscription, timeout, timer} from "rxjs";
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
  private pingInterval$: Observable<number> = timer(2000, 30000); // Ping every 30 seconds
  private pingSubscription: Subscription;

  private isConnected = new BehaviorSubject<boolean>(false);
  isConnected$ = this.isConnected.asObservable();

  token: string|null = null;

  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 20; // Set max attempts to prevent infinite retrying
  private reconnectionInterval = 1000; // Start with 1 second

  constructor(
    private errorService: ErrorService,
    private accountService: AccountService
  ) {
    this.accountService.token$.subscribe(token =>{
      if (token && token != this.token) {
        this.token = token;
        this.connect();
      }
    });
  }

  private connect(): void {
    this.socket$ = webSocket({
      url: environment.wsUrl,
      openObserver: {
        next: () => {
          if (environment.debug) {
            console.log('WebSocket connection opened');
          }
          this.startPing();
          this.isConnected.next(true);
          this.reconnectionAttempts = 0; // Reset on successful connection
        }
      },
      closeObserver: {
        next: () => {
          if (environment.debug) {
            console.log('WebSocket connection closed');
          }
          this.stopPing();
          this.isConnected.next(false);
          this.reconnect();
        }
      },
    });
    this.messages$ = this.socket$.pipe(
      timeout(60000), // 60 seconds to receive a message/ping response
      catchError(err => {
        if (err.name === 'TimeoutError') {
          this.errorService.handle('WebSocket connection timeout');
          this.reconnect();
        }
        throw "WebSocket connection error or timeout; "+err;
      })
    );
    if (environment.debug) {
      this.messages$.subscribe(message => {
        console.log('WebSocket message: ', message);
      });
    }
  }

  private reconnect(): void {
    if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
      setTimeout(() => {
        if (environment.debug) {
          console.log(`Attempting to reconnect (${this.reconnectionAttempts + 1}/${this.maxReconnectionAttempts})...`);
        }
        this.reconnectionAttempts++;
        this.connect();
      }, this.reconnectionInterval * this.reconnectionAttempts); // Increase delay with each attempt

      // Optionally, increase the reconnection interval to a maximum value
      // For example, cap at 30 seconds
      this.reconnectionInterval = Math.min(this.reconnectionInterval * 2, 30000);
    } else if (environment.debug) {
      console.log('Max reconnection attempts reached. Giving up.');
    }
  }

  private startPing(): void {
    this.pingSubscription = this.pingInterval$.subscribe(() => {
      const pingMessage: WsRequest = { command: 'PingConnection' };
      this.send(pingMessage);
    });
  }

  private stopPing(): void {
    if (this.pingSubscription) {
      this.pingSubscription.unsubscribe();
    }
  }

  send(message: WsRequest): void {
    if (environment.debug) {
      console.log('Websocket send: ', message.command);
    }
    if (!this.socket$) {
      if (environment.debug) {
        console.log('Send: websocket not connected');
      }
      return;
    }
    if (this.token) {
      message.token = this.token;
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
