import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if ([401, 403].includes(err.status)) {
        return throwError(() => new Error('Not authorized'));
      }
      return throwError(() => new Error('Request failed'));
    })
  );
};
