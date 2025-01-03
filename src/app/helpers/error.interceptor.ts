import {Injectable} from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    //@Optional() private accountService?: AccountService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(catchError(err => {
      if ([401, 403].includes(err.status)) {
        // auto logout if 401 or 403 response returned from api
        return throwError(() => new Error("Not authorized"));
      }

      //const error = err.error.message || err.statusText;
      return throwError(() => new Error("Request failed"));
    }));
  }
}
