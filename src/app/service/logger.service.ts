import {Injectable} from '@angular/core';
import {Message} from "../models/message";
import {catchError, Observable, Subject, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {WebsocketService} from "./websocket.service";

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private messages: Message[] = [];
  private messages$ = new Subject<Message[]>();

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService
  ) {
  }

  init(): void {
    this.loadFromApi().subscribe( messages => {
        this.messages = messages;
        this.messages$.next(this.messages);
        this.subscribeOnLogUpdates();
      }
    )
    this.websocketService.connect();
    this.websocketService.receive().subscribe(message => {
      console.log('Received: ', message.data);
      if (message.data) {
        const newMessage: Message = JSON.parse(message.data);
        this.messages.unshift(newMessage);
        this.messages$.next(this.messages);
      }
    });
  }

  private subscribeOnLogUpdates() {
    // Pusher.logToConsole = pusherConf.logToConsole;
    // const pusher = new Pusher(pusherConf.apiKey, {
    //   cluster: pusherConf.cluster
    // });
    // const channel = pusher.subscribe(pusherConf.channel);
    // channel.bind(pusherConf.event, (data: any) => {
    //   let message = {
    //     time: data.time,
    //     feature: data.feature,
    //     id: data.id,
    //     text: data.text
    //   };
    //   this.messages.unshift(message);
    //   this.messages$.next(this.messages);
    // });
    this.websocketService.send({command: 'ListenLog'});
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
    this.websocketService.close();
  }
}
