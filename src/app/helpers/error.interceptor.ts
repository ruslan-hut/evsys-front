import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const NOT_AUTHORIZED_KEY = 'errors.notAuthorized';
export const REQUEST_FAILED_KEY = 'errors.requestFailed';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if ([401, 403].includes(err.status)) {
        return throwError(() => new Error(NOT_AUTHORIZED_KEY));
      }
      return throwError(() => new Error(REQUEST_FAILED_KEY));
    })
  );
};
