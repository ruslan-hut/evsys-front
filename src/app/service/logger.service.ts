import {Injectable} from '@angular/core';
import Pusher from "pusher-js";
import {Message} from "../models/message";
import {catchError, Observable, Subject, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment, pusherConf} from "../../environments/environment";

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
    Pusher.logToConsole = pusherConf.logToConsole;
    const pusher = new Pusher(pusherConf.apiKey, {
      cluster: pusherConf.cluster
    });
    const channel = pusher.subscribe(pusherConf.channel);
    channel.bind(pusherConf.event, (data: any) => {
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
    return this.http.get<Message[]>(environment.apiUrl+environment.readSysLog)
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
