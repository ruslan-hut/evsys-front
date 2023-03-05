import {Injectable} from '@angular/core';
import Pusher from "pusher-js";
import {Message} from "../models/message";
import {catchError, Observable, Subject, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "./error.service";

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private messages: Message[] = [];
  private messages$ = new Subject<Message[]>();

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {
  }

  init(): void {
    this.loadFromApi().subscribe( messages => {
        this.messages = messages;
        this.messages$.next(this.messages);
        this.subscribeOnPusherUpdates();
      }
    )
  }

  private subscribeOnPusherUpdates() {
    //Pusher.logToConsole = true
    const pusher = new Pusher('a1f101fb40a32c47c791', {
      cluster: 'eu'
    });
    const channel = pusher.subscribe('sys_log');
    channel.bind('call_event', (data: any) => {
      let message = {
        time: data.time,
        feature: data.feature,
        id: data.id,
        text: data.text
      };
      this.messages.unshift(message);
      this.messages$.next(this.messages);
    });
  }

  private loadFromApi(): Observable<Message[]> {
    return this.http.get<Message[]>('https://hoot.com.ua:8800/api/v1/log')
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
}
