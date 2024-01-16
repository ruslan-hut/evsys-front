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
  private chargePoints: Chargepoint[] = [];
  private chargePoints$ = new Subject<Chargepoint[]>();



  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService) {
  }

  init(): void {
    this.getAll().subscribe(chargePoints => {
      this.chargePoints = chargePoints;
      this.chargePoints$.next(this.chargePoints);
      this.websocketService.send({command: 'ListenChargePoints'});
    });
    this.websocketService.connect();
    this.websocketService.receive().subscribe(message => {
      this.onWsMessage(message)
    });
  }

  getChargePoints(): Observable<Chargepoint[]> {
    return this.chargePoints$;
  }

  getChargePoint(id: string): Observable<Chargepoint> {
    return this.http.get<Chargepoint>(environment.apiUrl + environment.chargePoint + id)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  postChargePoint(chargePoint: Chargepoint): Observable<Chargepoint> {
    return this.http.post<Chargepoint>(environment.apiUrl + environment.chargePoint + chargePoint.charge_point_id, chargePoint)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  currentChargePoints(): Chargepoint[] {
    return this.chargePoints;
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
    // if (message.data) {
    //   const updated: Chargepoint = JSON.parse(message.data);
    //   console.log('Updated: ', updated.charge_point_id);
    //   // this.chargepoints$ = this.chargepoints$.pipe(
    //   //   map(chargepoints => chargepoints.map(chargepoint => {
    //   //     if (chargepoint.charge_point_id === updated.charge_point_id) {
    //   //       return updated;
    //   //     }
    //   //     return chargepoint;
    //   //   })));
    // }
    if (message.status === 'ping') {
      this.websocketService.send({command: 'ListenLog'});
      return;
    }
    if (message.status === 'error') {
      this.errorService.handle('WS error: ' + message.info);
      return;
    }
    if (message.status === 'event') {
      if (message.data) {
        const updated = JSON.parse(message.data);
        const index = this.chargePoints.findIndex(chp => chp.charge_point_id == updated);
        if (index !== -1) {
          this.chargePoints[index] = updated;
          this.chargePoints$.next(this.chargePoints);
        }
        console.log('Updated: ', updated);
      }
    }
    // console.log('msg: ', message);
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  onStop(): void {
    this.websocketService.close();
  }

}
