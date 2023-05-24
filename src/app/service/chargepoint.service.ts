import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {catchError, Observable, Subject, throwError} from "rxjs";
import {Chargepoint} from "../models/chargepoint";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {WebsocketService} from "./websocket.service";
import {WsMessage} from "../models/ws-message";

@Injectable({
  providedIn: 'root'
})
export class ChargepointService {

  chargePoints$ = new Subject<Chargepoint[]>();

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService) {
  }

  init(): void {
    this.getAll().subscribe(chargepoints => {
      this.chargePoints$.next(chargepoints);
      this.websocketService.send({command: 'ListenChargePoints'});
    });
    this.websocketService.connect();
    this.websocketService.receive().subscribe(message => {
      this.onWsMessage(message)
    });
  }

  private getAll(): Observable<Chargepoint[]> {
    return this.http.get<Chargepoint[]>(environment.apiUrl + environment.chargePointList)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  create(chargepoint: Chargepoint): Observable<Chargepoint> {
    return this.http.post<Chargepoint>('https://fakestoreapi.com/products', chargepoint)
  }

  private onWsMessage(message: WsMessage) {
    if (message.data) {
      const updated: Chargepoint = JSON.parse(message.data);
      console.log('Updated: ', updated.charge_point_id);
      // this.chargepoints$ = this.chargepoints$.pipe(
      //   map(chargepoints => chargepoints.map(chargepoint => {
      //     if (chargepoint.charge_point_id === updated.charge_point_id) {
      //       return updated;
      //     }
      //     return chargepoint;
      //   })));
    }
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  onStop(): void {
    this.websocketService.close();
  }

}
