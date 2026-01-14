import { Component, OnInit, AfterContentInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChargepointService } from '../../service/chargepoint.service';
import { MatTableDataSource } from '@angular/material/table';
import { Chargepoint } from '../../models/chargepoint';
import { Router } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatFabButton } from '@angular/material/button';

@Component({
  selector: 'app-promo-list',
  templateUrl: './promo-list.component.html',
  styleUrls: ['./promo-list.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatFabButton]
})
export class PromoListComponent implements OnInit, AfterContentInit, OnDestroy {
  private readonly chargePointService = inject(ChargepointService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  loading = false;
  dataSource = new MatTableDataSource<Chargepoint>();

  ngOnInit(): void {
    this.loading = true;
    this.chargePointService.subscribeOnUpdates();

    this.chargePointService.getChargePoints().pipe(
      takeUntil(this.destroy$)
    ).subscribe((chargePoints) => {
      this.dataSource.data = chargePoints;
      this.cdr.markForCheck();
    });
  }

  ngAfterContentInit(): void {
    const data = this.chargePointService.currentChargePoints();
    if (data.length !== this.dataSource.data.length) {
      this.dataSource.data = data;
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chargePointService.unsubscribeFromUpdates();
  }

  selectChargePoint(chargePoint: Chargepoint): void {
    this.router.navigate(['/promo-point', { id: chargePoint.charge_point_id }]);
  }
}
