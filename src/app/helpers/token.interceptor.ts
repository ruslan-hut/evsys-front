import {Injectable} from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../environments/environment";
import {AccountService} from "../service/account.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  token: string | null = null;

  constructor(private accountService: AccountService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // if (environment.debug) {
    //   console.log("Request", request.url)
    // }
    if (request.headers.get('skip-interceptor') === 'true') {
      const newRequest = request.clone({headers: request.headers.delete('skip-interceptor')});
      return next.handle(newRequest);
    }
    this.token = this.accountService.userToken()
    const isApiUrl = request.url.startsWith(environment.apiUrl);
    if (this.token && isApiUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.token}`
        }
      });
    }
    return next.handle(request);
  }

}
