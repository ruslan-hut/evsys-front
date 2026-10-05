import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {OAuthConsent, OAuthRedirect} from '../models/oauth-consent';

/** Consent decisions for MCP clients (Claude etc.) asking to read EVSys data. */
@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private readonly http = inject(HttpClient);

  private requestUrl(requestId: string): string {
    return `${environment.apiUrl}/oauth/requests/${encodeURIComponent(requestId)}`;
  }

  consent(requestId: string): Observable<OAuthConsent> {
    return this.http.get<OAuthConsent>(this.requestUrl(requestId));
  }

  approve(requestId: string): Observable<OAuthRedirect> {
    return this.http.post<OAuthRedirect>(`${this.requestUrl(requestId)}/approve`, {});
  }

  deny(requestId: string): Observable<OAuthRedirect> {
    return this.http.post<OAuthRedirect>(`${this.requestUrl(requestId)}/deny`, {});
  }
}
