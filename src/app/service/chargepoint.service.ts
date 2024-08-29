import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {BehaviorSubject, catchError, Observable, throwError} from "rxjs";
import {Chargepoint} from "../models/chargepoint";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {WebsocketService} from "./websocket.service";
import {WsMessage} from "../models/ws-message";
import {AccountService} from "./account.service";
import {CsCommand} from "../models/cs-command";
import {CsCommandResponse} from "../models/cs-command-response";

@Injectable({
  providedIn: 'root'
})
export class ChargepointService {
  private chargePoints: Chargepoint[] = [];
  private chargePoints$ = new BehaviorSubject<Chargepoint[]>([]);

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService,
    private accountService: AccountService,
  ) {
    this.accountService.authState$.subscribe(status =>{
      if (status) {
        this.init();
      }
    });
  }

  private init(): void {
    this.getAll().subscribe(result => {
      if (result) {
        this.chargePoints = result;
        this.chargePoints$.next(this.chargePoints);
      }
    });
    this.websocketService.receive().subscribe(message => {
      this.onWsMessage(message)
    });
  }

  subscribeOnUpdates(): void {
    this.websocketService.isConnected$.subscribe(status =>{
      if (status) {
        this.websocketService.send({command: 'ListenChargePoints'});
      }
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

  private onWsMessage(message: WsMessage) {
    if (message.status == 'error') {
      if (message.info) {
        this.errorService.handle(message.info);
      }
      return;
    }
    if (message.status == 'event' && message.stage == 'charge-point-event') {
      if (message.data) {
        const updated = message.data;
        const index = this.chargePoints.findIndex(chp => chp.charge_point_id == updated);
        if (index !== -1) {
          this.getChargePoint(updated).subscribe(chargePoint => {
            this.chargePoints[index] = chargePoint;
            this.chargePoints$.next(this.chargePoints);
          });
        }
      }
    }
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  onStop(): void {
    //this.websocketService.close();
  }

  sendCsCommand(chargePointId: string, connectorId:number, command: string, payload: string): Observable<CsCommandResponse> {
    const csCommand: CsCommand = {
      charge_point_id: chargePointId,
      connector_id: connectorId,
      feature_name: command,
      payload: payload,
    }

    return this.http.post<CsCommandResponse>(environment.apiUrl + environment.sendCommand, csCommand)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }
}
