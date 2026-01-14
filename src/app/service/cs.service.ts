import { Injectable, inject } from "@angular/core";
import {catchError, Observable, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {CsCommandResponse} from "../models/cs-command-response";
import {CsCommand} from "../models/cs-command";
import {CsResponse} from "../models/cs-response";

@Injectable({
  providedIn: 'root'
})
export class CSService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

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

    return this.http.post<CsCommandResponse>(environment.apiUrl + environment.sendCommand, csCommand)
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

  processCentralSystemResponse(response: CsCommandResponse, description: string) {
    const resp = (JSON.parse(response.info) as CsResponse);
    if (resp.status == "Accepted" && response.status == 'success') {
      this.errorService.handle(description);
    } else {
      if (resp.error != null) {
        this.errorService.handle(resp.error);
      }else{
        this.errorService.handle(resp.status);
      }
      if (environment.debug) {
        console.log(response)
      }
    }
  }
}
