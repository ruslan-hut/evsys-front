import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {MailSubscription} from '../models/mail-subscription';

@Injectable({
  providedIn: 'root'
})
export class MailSubscriptionService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return environment.apiUrl + environment.mailSubscriptions;
  }

  list(): Observable<MailSubscription[]> {
    return this.http.get<MailSubscription[]>(this.baseUrl);
  }

  create(sub: MailSubscription): Observable<MailSubscription> {
    return this.http.post<MailSubscription>(this.baseUrl, sub);
  }

  update(id: string, sub: MailSubscription): Observable<MailSubscription> {
    return this.http.put<MailSubscription>(`${this.baseUrl}/${id}`, sub);
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }

  sendNow(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${id}/send-now`, {});
  }
}
