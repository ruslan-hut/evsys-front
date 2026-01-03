import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChargepointService } from '../../service/chargepoint.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { Router } from '@angular/router';
import { ChargepointComponent } from '../chargepoint/chargepoint.component';
import { Chargepoint } from '../../models/chargepoint';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chargepoint-list',
  templateUrl: './chargepoint-list.component.html',
  styleUrls: ['./chargepoint-list.component.css'],
  standalone: true,
  imports: [ChargepointComponent, AsyncPipe, MatButtonModule]
})
export class ChargepointListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedChargePoints$ = new BehaviorSubject<Chargepoint[]>([]);
  showingFullList = false;

  constructor(
    private chargepointService: ChargepointService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.redirectToChargePointScreen();
    if (this.localStorageService.getAlwaysLoadAllChargers()) {
      this.loadFullList();
    } else {
      this.loadRecentChargePoints();
    }
    this.chargepointService.subscribeOnUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chargepointService.unsubscribeFromUpdates();
  }

  private loadRecentChargePoints(): void {
    this.chargepointService.getRecentChargePoints().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result && result.length > 0) {
        this.displayedChargePoints$.next(result);
      } else {
        this.loadFullList();
      }
    });
  }

  loadFullList(): void {
    this.showingFullList = true;
    this.chargepointService.getAllChargePoints().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {
        this.displayedChargePoints$.next(result);
      }
    });
  }

  redirectToChargePointScreen(): void {
    const redirectUrl = this.localStorageService.getRedirectUrl();
    if (redirectUrl) {
      this.router.navigate(['new-transactions'], {
        queryParams: { charge_point_id: redirectUrl.charge_point_id, connector_id: redirectUrl.connector_id }
      });
    }
  }
}
