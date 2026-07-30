import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {WebhookSubscriber} from '../models/webhook-subscriber';
import {WebhookDelivery, WebhookHealth} from '../models/webhook-health';

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return environment.apiUrl + environment.webhooks;
  }

  list(): Observable<WebhookSubscriber[]> {
    return this.http.get<WebhookSubscriber[]>(`${this.baseUrl}/subscribers`);
  }

  create(sub: WebhookSubscriber): Observable<WebhookSubscriber> {
    return this.http.post<WebhookSubscriber>(`${this.baseUrl}/subscribers`, sub);
  }

  update(id: string, sub: WebhookSubscriber): Observable<WebhookSubscriber> {
    return this.http.put<WebhookSubscriber>(`${this.baseUrl}/subscribers/${id}`, sub);
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/subscribers/${id}`);
  }

  health(): Observable<WebhookHealth[]> {
    return this.http.get<WebhookHealth[]>(`${this.baseUrl}/health`);
  }

  failures(): Observable<WebhookDelivery[]> {
    return this.http.get<WebhookDelivery[]>(`${this.baseUrl}/failures`);
  }
}
