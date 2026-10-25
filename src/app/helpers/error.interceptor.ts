import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const NOT_AUTHORIZED_KEY = 'errors.notAuthorized';
export const REQUEST_FAILED_KEY = 'errors.requestFailed';

/**
 * The error a failed request surfaces: an i18n key as the message, plus the
 * backend's own explanation when it sent one, for screens that show it.
 */
export interface RequestError extends Error {
  serverMessage?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const key = [401, 403].includes(err.status) ? NOT_AUTHORIZED_KEY : REQUEST_FAILED_KEY;
      const error: RequestError = new Error(key);
      const serverMessage = (err.error as { status_message?: unknown } | null)?.status_message;
      if (typeof serverMessage === 'string' && serverMessage) {
        error.serverMessage = serverMessage;
      }
      return throwError(() => error);
    })
  );
};

/** The backend's explanation of a failed request, or '' when it sent none. */
export function serverMessage(err: unknown): string {
  return (err as RequestError | null)?.serverMessage ?? '';
}
