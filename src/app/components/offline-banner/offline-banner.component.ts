import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { NetworkService } from '../../service/network.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [AsyncPipe, MatIcon],
  template: `
    @if (!(networkService.isOnline$ | async)) {
      <div class="offline-banner">
        <mat-icon>wifi_off</mat-icon>
        <span>You are offline</span>
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background-color: #f44336;
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .offline-banner mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class OfflineBannerComponent {
  constructor(public networkService: NetworkService) {}
}
