import { Component } from '@angular/core';
import {MonthStats} from "../../models/month-stats";
import {UserStats} from "../../models/user-stats";

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrl: './statistic.component.css'
})
export class StatisticComponent {
  monthStats: MonthStats[] = [
    { year: 2023, month: 5, count: 120, watts: 50000, avgWatts: 50 },
    { year: 2023, month: 6, count: 150, watts: 60000, avgWatts: 60 }
  ];
  userStats: UserStats[] = [
    { name: 'Alice', total: 200, count: 10 },
    { name: 'Bob', total: 300, count: 15 }
  ];

  predefinedRanges = [
    { label: 'Previous Month', range: this.getPreviousMonth() },
    { label: 'Current Month', range: this.getCurrentMonth() },
    { label: 'Current Year', range: this.getCurrentYear() }
  ];

  displayedData: any[] = [];
  displayedColumns: string[] = [];

  // Selected filters
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedRole: string = '';
  selectedDataType: string = 'month';
  groups: string[] = ['Client', 'Office'];

  constructor() {
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
      this.displayedColumns = ['name', 'total', 'count'];
    }
  }

  // Method to request data
  requestData() {
    this.updateDisplayedData();
  }
}
