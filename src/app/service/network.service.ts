import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService implements OnDestroy {
  private onlineStatus = new BehaviorSubject<boolean>(navigator.onLine);

  /** Observable that emits true when online, false when offline */
  isOnline$ = this.onlineStatus.asObservable();

  /** Current online status */
  get isOnline(): boolean {
    return this.onlineStatus.value;
  }

  private onlineSubscription = merge(
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(
    startWith(navigator.onLine)
  ).subscribe(status => {
    this.onlineStatus.next(status);
  });

  ngOnDestroy(): void {
    this.onlineSubscription.unsubscribe();
  }
}
