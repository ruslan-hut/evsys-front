import {Injectable} from "@angular/core";
import {BehaviorSubject, catchError, Observable, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {CsCommandResponse} from "../models/cs-command-response";
import {CsCommand} from "../models/cs-command";

@Injectable({
  providedIn: 'root'
})
export class CSService {

  constructor(
    private http: HttpClient,
    private errorService: ErrorService,
  ) {
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  sendCsCommand(chargePointId: string, connectorId:number, command: string, payload: string): Observable<CsCommandResponse> {
    const csCommand: CsCommand = {
      charge_point_id: chargePointId,
      connector_id: connectorId,
      feature_name: command,
      payload: payload,
    }

    return this.http.post<CsCommandResponse>(environment.apiUrl + environment.sengCommand, csCommand)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  startTransaction(chargePointId: string, connectorId:number): Observable<CsCommandResponse> {
    return this.sendCsCommand(chargePointId, connectorId, "RemoteStartTransaction", "")
  }

  stopTransaction(chargePointId: string, connectorId:number, transactionID: string): Observable<CsCommandResponse> {
    return this.sendCsCommand(chargePointId, connectorId, "RemoteStopTransaction", transactionID)
  }

  unlockConnector(chargePointId: string, connectorId:number): Observable<CsCommandResponse> {
    return this.sendCsCommand(chargePointId, connectorId, "UnlockConnector", "")
  }

  softRebootChargePoint(chargePointId: string): Observable<CsCommandResponse> {
    return this.sendCsCommand(chargePointId, 0, "Reset", "Soft")
  }

  hardRebootChargePoint(chargePointId: string): Observable<CsCommandResponse> {
    return this.sendCsCommand(chargePointId, 0, "Reset", "Hard")
  }
}
