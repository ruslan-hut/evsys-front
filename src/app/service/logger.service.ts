import {Injectable} from '@angular/core';
import {Message} from "../models/message";
import {BehaviorSubject, catchError, Observable, Subject, throwError} from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {WebsocketService} from "./websocket.service";
import {AccountService} from "./account.service";

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private messages: Message[] = [];
  private messages$ = new Subject<Message[]>();

  private isOnline = new BehaviorSubject(false);
  isOnline$ = this.isOnline.asObservable();

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService,
    private accountService: AccountService,
  ) {
    this.accountService.user$.subscribe(user =>{
      if (user) {
        this.init();
      }
    });
  }

  subscribeOnUpdates(): void {
    this.websocketService.isConnected$.subscribe(status =>{
      this.isOnline.next(status);
      if (status) {
        this.websocketService.send({command: 'ListenLog'});
      }
    });
  }

  private init(): void {
    this.loadFromApi().subscribe( messages => {
        this.messages = messages;
        this.messages$.next(this.messages);
      }
    )
    this.websocketService.receive().subscribe(message => {
      if (message.status === 'error') {
        if (message.info) {
          this.errorService.handle(message.info);
        }
        return;
      }
      if (message.status === 'event' && message.stage === 'log-event') {
        if (message.data) {
          const newMessage: Message = JSON.parse(message.data);
          this.messages.unshift(newMessage);
          this.messages$.next(this.messages);
        }
      }
    });
  }

  private loadFromApi(): Observable<Message[]> {
    const url = environment.apiUrl + environment.readSysLog;
    return this.http.get<Message[]>(url)
      .pipe(catchError(this.errorHandler.bind(this)));
  }

  getMessages(): Observable<Message[]> {
    return this.messages$;
  }

  currentMessages(): Message[] {
    return this.messages;
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  onStop(): void {
    //this.websocketService.close();
  }
}
