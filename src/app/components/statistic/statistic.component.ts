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
    { label: 'Today', range: this.getToday() },
    { label: 'Current Month', range: this.getCurrentMonth() },
    { label: 'Previous Month', range: this.getPreviousMonth() },
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

  totalUserCount = 0;
  totalUserWatts = 0;
  avgUserWatts = 0;

  totalMonthCount = 0;
  totalMonthWatts = 0;
  avgMonthWatts = 0;

  constructor(
    private statsService: StatsService
  ) {
    this.groups = this.statsService.getGroups()
    this.selectedGroup = this.groups[0].id;
    this.updateDisplayedData();
  }

  calculateAggregates() {
    if (this.selectedDataType === 'user' || this.selectedDataType === 'charger') {
      this.totalUserCount = this.displayedData.reduce((sum, user) => sum + user.count, 0);
      this.totalUserWatts = this.displayedData.reduce((sum, user) => sum + user.total, 0);
      this.avgUserWatts = this.totalUserWatts / this.totalUserCount;
    } else if (this.selectedDataType === 'month') {
      this.totalMonthCount = this.displayedData.reduce((sum, month) => sum + month.count, 0);
      this.totalMonthWatts = this.displayedData.reduce((sum, month) => sum + month.total, 0);
      this.avgMonthWatts = this.totalMonthWatts / this.totalMonthCount;
    }
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

  private getToday() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = start;
    return { start, end };
  }

  // Method to update displayed data based on selected data type
  updateDisplayedData() {
    if (this.selectedDataType === 'month') {
      this.displayedData = this.monthStats;
      this.displayedColumns = ['year', 'month', 'count', 'watts', 'avgWatts'];
    } else if (this.selectedDataType === 'user') {
      this.displayedData = this.userStats;
      this.displayedColumns = ['name', 'userCount', 'userWatts', 'userAvgWatts'];
    } else if (this.selectedDataType === 'charger') {
      this.displayedData = this.userStats;
      this.displayedColumns = ['name', 'userCount', 'userWatts', 'userAvgWatts'];
    }
    this.calculateAggregates();
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
    } else if (this.selectedDataType === 'charger') {
      this.statsService.getChargerReport(this.startDate, this.endDate, this.selectedGroup)
        .subscribe(data => {
          this.userStats = data;
          this.updateDisplayedData();
        });
    }
  }
}
