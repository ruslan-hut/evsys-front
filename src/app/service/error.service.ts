import { Injectable, OnDestroy } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements OnDestroy {
  private errorSubject = new Subject<string>();
  readonly error$ = this.errorSubject.asObservable();

  handle(message: string): void {
    this.errorSubject.next(message);
  }

  ngOnDestroy(): void {
    this.errorSubject.complete();
  }
}
