import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {PaymentRetryItem} from '../models/payment-retry';

@Injectable({
  providedIn: 'root'
})
export class PaymentRetryService {
  private readonly http = inject(HttpClient);

  list(): Observable<PaymentRetryItem[]> {
    return this.http.get<PaymentRetryItem[]>(environment.apiUrl + environment.paymentRetries);
  }

  forceRetry(transactionId: number): Observable<{status: string}> {
    return this.http.post<{status: string}>(
      `${environment.apiUrl}${environment.paymentRetries}/${transactionId}/force`,
      {},
    );
  }
}
