import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, Subscription, timer } from 'rxjs';
import { catchError, filter, finalize, map, retry, take, takeUntil } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { WsMessage } from '../models/ws-message';
import { AccountService } from './account.service';
import { WsRequest } from '../models/ws-request';
import { WsConnectionState } from '../models/ws-connection-state';
import { WsChannel, channelKey, parseChannelKey } from '../models/ws-channel';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  // Connection state machine
  private connectionState = new BehaviorSubject<WsConnectionState>(WsConnectionState.DISCONNECTED);
  connectionState$ = this.connectionState.asObservable();

  // Backward compatibility: derived from connectionState$
  isConnected$ = this.connectionState$.pipe(
    map(state => state === WsConnectionState.CONNECTED)
  );

  // Internal message stream (all incoming messages)
  private messagesSubject = new Subject<WsMessage>();

  // Subscription registry: channelKey -> reference count
  private subscriptionRegistry = new Map<string, number>();

  // Message queue for commands during reconnection
  private messageQueue: WsRequest[] = [];

  // Socket and subscriptions
  private socket$: WebSocketSubject<any> | null = null;
  private socketSubscription: Subscription | null = null;
  private pingSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  // Auth token (optional - for authenticated commands)
  private token: string | null = null;

  // Connection tracking
  private connectionCount = 0;

  constructor(private accountService: AccountService) {
    // Listen for token changes (don't trigger reconnect, just update token)
    this.accountService.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.token = user?.token ?? null;
      if (environment.debug) {
        console.log('WS: token updated', this.token ? 'present' : 'null');
      }
    });

    // Connect after auth is ready (not tied to login/logout)
    this.accountService.authReady$.pipe(
      take(1)
    ).subscribe(() => {
      if (environment.debug) {
        console.log('WS: auth ready, initiating connection');
      }
      this.connect();
    });

    // Handle page visibility changes (mobile background/foreground)
    this.setupVisibilityHandler();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeVisibilityHandler();
    this.close();
  }

  // ============ PUBLIC API ============

  /**
   * Subscribe to a channel. Returns an observable that emits relevant messages.
   * Automatically sends subscription command and tracks in registry.
   * Unsubscribing from the returned observable will decrement the registry count
   * and send unsubscribe command when count reaches 0.
   */
  subscribe(channel: WsChannel): Observable<WsMessage> {
    const key = channelKey(channel);
    const currentCount = this.subscriptionRegistry.get(key) ?? 0;

    // First subscription for this channel - send command
    if (currentCount === 0) {
      this.sendSubscriptionCommand(channel);
    }

    this.subscriptionRegistry.set(key, currentCount + 1);

    if (environment.debug) {
      console.log(`WS: subscribe to ${key}, count: ${currentCount + 1}`);
    }

    // Return filtered message stream that decrements on unsubscribe
    return this.messagesSubject.pipe(
      filter(msg => this.messageMatchesChannel(msg, channel)),
      finalize(() => {
        const count = this.subscriptionRegistry.get(key) ?? 1;
        if (count <= 1) {
          this.subscriptionRegistry.delete(key);
          this.sendUnsubscribeCommand(channel);
          if (environment.debug) {
            console.log(`WS: unsubscribed from ${key}, removed from registry`);
          }
        } else {
          this.subscriptionRegistry.set(key, count - 1);
          if (environment.debug) {
            console.log(`WS: unsubscribed from ${key}, count: ${count - 1}`);
          }
        }
      })
    );
  }

  /**
   * Send a one-time command (not a subscription).
   * Commands are queued if not connected and sent when connection is established.
   */
  send(message: WsRequest): void {
    if (this.token) {
      message.token = this.token;
    }

    if (this.connectionState.value === WsConnectionState.CONNECTED && this.socket$) {
      if (environment.debug) {
        console.log('WS >> ', message.command, message.charge_point_id, message.connector_id, message.transaction_id);
      }
      this.socket$.next(message);
    } else {
      // Queue message for when connected
      if (environment.debug) {
        console.log('WS: queued message', message.command);
      }
      this.messageQueue.push(message);
    }
  }

  /**
   * Get raw message stream (for services that need all messages).
   * Backward compatible with old API.
   */
  receive(): Observable<WsMessage> {
    return this.messagesSubject.asObservable();
  }

  /**
   * Close the WebSocket connection.
   */
  close(): void {
    this.stopPing();
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = null;
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    this.connectionState.next(WsConnectionState.DISCONNECTED);
  }

  // ============ PRIVATE METHODS ============

  private connect(): void {
    if (this.connectionState.value === WsConnectionState.CONNECTING) {
      if (environment.debug) {
        console.log('WS: already connecting, skipping');
      }
      return;
    }

    this.connectionState.next(WsConnectionState.CONNECTING);

    this.socket$ = webSocket({
      url: environment.wsUrl,
      openObserver: {
        next: () => this.onOpen()
      },
      closeObserver: {
        next: () => this.onClose()
      }
    });

    this.socketSubscription = this.socket$.pipe(
      catchError(err => {
        this.onError(err);
        return EMPTY;
      }),
      retry({ delay: 5000 })
    ).subscribe(message => {
      this.messagesSubject.next(message);
    });
  }

  private onOpen(): void {
    const wasReconnecting = this.connectionState.value === WsConnectionState.RECONNECTING;
    this.connectionCount++;

    if (environment.debug) {
      console.log('WS: connection opened', this.connectionCount, wasReconnecting ? '(reconnect)' : '');
    }

    this.connectionState.next(WsConnectionState.CONNECTED);

    this.startPing();
    this.flushMessageQueue();

    // Re-subscribe to all active channels on reconnect
    if (wasReconnecting) {
      this.resubscribeAll();
    }
  }

  private onClose(): void {
    if (environment.debug) {
      console.log('WS: connection closed');
    }

    this.stopPing();

    // If we were connected, switch to reconnecting state (retry will handle reconnection)
    if (this.connectionState.value === WsConnectionState.CONNECTED) {
      this.connectionState.next(WsConnectionState.RECONNECTING);
    }
  }

  private onError(err: any): void {
    if (environment.debug) {
      console.error('WS: connection error', err);
    }
  }

  private flushMessageQueue(): void {
    if (environment.debug && this.messageQueue.length > 0) {
      console.log(`WS: flushing ${this.messageQueue.length} queued messages`);
    }

    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      this.send(msg);
    }
  }

  private resubscribeAll(): void {
    if (environment.debug) {
      console.log(`WS: resubscribing to ${this.subscriptionRegistry.size} channels`);
    }

    // Re-send subscription commands for all active subscriptions
    for (const key of this.subscriptionRegistry.keys()) {
      const channel = parseChannelKey(key);
      this.sendSubscriptionCommand(channel);
    }
  }

  private sendSubscriptionCommand(channel: WsChannel): void {
    const request: WsRequest = {
      command: channel.command,
      ...channel.params
    };
    this.send(request);
  }

  private sendUnsubscribeCommand(channel: WsChannel): void {
    const unsubCommand = this.getUnsubscribeCommand(channel.command);
    if (unsubCommand) {
      const request: WsRequest = {
        command: unsubCommand,
        ...channel.params
      };
      this.send(request);
    }
  }

  private getUnsubscribeCommand(subscribeCommand: string): string | null {
    const mapping: Record<string, string> = {
      'ListenChargePoints': 'StopListenChargePoints',
      'ListenTransaction': 'StopListenTransaction',
      'ListenLog': 'StopListenLog'
    };
    return mapping[subscribeCommand] ?? null;
  }

  private messageMatchesChannel(msg: WsMessage, channel: WsChannel): boolean {
    // Filter messages based on channel type
    switch (channel.command) {
      case 'ListenChargePoints':
        return msg.stage === 'charge-point-event';
      case 'ListenTransaction':
        // Match by transaction ID if specified
        return msg.id === channel.params?.transaction_id ||
               msg.meter_value?.transaction_id === channel.params?.transaction_id;
      case 'ListenLog':
        return msg.stage === 'log-event';
      default:
        return true;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingSubscription = timer(10000, 30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.send({ command: 'PingConnection' });
    });
  }

  private stopPing(): void {
    this.pingSubscription?.unsubscribe();
    this.pingSubscription = null;
  }

  private visibilityHandler = () => this.onVisibilityChange();

  private setupVisibilityHandler(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private removeVisibilityHandler(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      if (environment.debug) {
        console.log('WS: page became visible, checking connection');
      }

      // Force reconnect if not connected or in a stale state
      if (this.connectionState.value !== WsConnectionState.CONNECTED) {
        if (environment.debug) {
          console.log('WS: reconnecting after visibility change');
        }
        this.reconnect();
      } else {
        // Connection appears active, send a ping to verify
        // If the connection is stale, this will trigger an error and reconnect
        this.send({ command: 'PingConnection' });
      }
    }
  }

  private reconnect(): void {
    this.close();
    this.connect();
  }
}
