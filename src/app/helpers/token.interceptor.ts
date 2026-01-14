import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccountService } from '../service/account.service';
import { environment } from '../../environments/environment';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const accountService = inject(AccountService);

  if (req.headers.get('skip-interceptor') === 'true') {
    const newRequest = req.clone({ headers: req.headers.delete('skip-interceptor') });
    return next(newRequest);
  }

  const token = accountService.userToken();
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  if (token && isApiUrl) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
