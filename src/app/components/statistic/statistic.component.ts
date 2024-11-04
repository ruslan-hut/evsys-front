import { Component } from '@angular/core';
import {MonthStats} from "../../models/month-stats";
import {UserStats} from "../../models/user-stats";
import {StatsService} from "../../service/stats.service";
import {Group} from "../../models/group";

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrl: './statistic.component.css'
})
export class StatisticComponent {
  monthStats: MonthStats[] = [];
  userStats: UserStats[] = [];

  predefinedRanges = [
    { label: 'Previous Month', range: this.getPreviousMonth() },
    { label: 'Current Month', range: this.getCurrentMonth() },
    { label: 'Current Year', range: this.getCurrentYear() }
  ];

  displayedData: any[] = [];
  displayedColumns: string[] = [];

  // Selected filters
  groups: Group[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedDataType: string = 'month';
  selectedGroup: string = '';

  inProgress = false;

  constructor(
    private statsService: StatsService
  ) {
    this.groups = this.statsService.getGroups()
    this.selectedGroup = this.groups[0].id;
    this.updateDisplayedData();
  }

  // Method to set the date range
  setRange(range: { start: Date; end: Date }) {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  // Helper methods to get date ranges
  private getPreviousMonth() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  private getCurrentMonth() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  private getCurrentYear() {
    const date = new Date();
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear() + 1, 0, 0);
    return { start, end };
  }

  // Method to handle filter change
  onFilterChange() {
    this.updateDisplayedData();
  }

  // Method to update displayed data based on selected data type
  updateDisplayedData() {
    if (this.selectedDataType === 'month') {
      this.displayedData = this.monthStats;
      this.displayedColumns = ['year', 'month', 'count', 'watts', 'avgWatts'];
    } else if (this.selectedDataType === 'user') {
      this.displayedData = this.userStats;
      this.displayedColumns = ['name', 'userCount', 'userWatts', 'userAvgWatts'];
    }
    this.inProgress = false;
  }

  // Method to request data
  requestData() {
    this.inProgress = true;
    if (this.selectedDataType === 'month') {
      this.statsService.getMonthlyReport(this.startDate, this.endDate, this.selectedGroup)
        .subscribe(data => {
          this.monthStats = data;
          this.updateDisplayedData();
        });
    } else if (this.selectedDataType === 'user') {
      this.statsService.getUserReport(this.startDate, this.endDate, this.selectedGroup)
        .subscribe(data => {
          this.userStats = data;
          this.updateDisplayedData();
        });
    }
  }
}
