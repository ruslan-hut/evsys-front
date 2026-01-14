import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTabGroup, MatTab, MatTabContent } from '@angular/material/tabs';
import { StationStatusComponent } from './station-status/station-status.component';
import { StationUptimeComponent } from './station-uptime/station-uptime.component';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabGroup,
    MatTab,
    MatTabContent,
    StationStatusComponent,
    StationUptimeComponent
  ]
})
export class ReportsComponent {
  activeTabIndex = 0;

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }
}
