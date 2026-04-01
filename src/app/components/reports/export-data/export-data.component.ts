import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { StatsService } from '../../../service/stats.service';
import { Group } from '../../../models/group';
import { ExportData } from '../../../models/export-data';
import { MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-export-data',
  templateUrl: './export-data.component.html',
  styleUrl: './export-data.component.css',
  standalone: true,
  imports: [
    MatFormField, MatLabel, MatDateRangeInput, MatStartDate, FormsModule,
    MatEndDate, MatHint, MatDatepickerToggle, MatSuffix, MatIconButton,
    MatMenuTrigger, MatIcon, MatMenu, MatMenuItem, MatDateRangePicker,
    MatSelect, MatOption, MatButton, MatProgressBar
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportDataComponent {
  private readonly statsService = inject(StatsService);
  private readonly cdr = inject(ChangeDetectorRef);

  groups: Group[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedGroup: string = '';
  inProgress = false;

  predefinedRanges = [
    { label: 'Today', range: this.getToday() },
    { label: 'Current Month', range: this.getCurrentMonth() },
    { label: 'Previous Month', range: this.getPreviousMonth() },
    { label: 'Current Year', range: this.getCurrentYear() }
  ];

  constructor() {
    this.groups = this.statsService.getGroups();
    this.selectedGroup = this.groups[0].id;
  }

  setRange(range: { start: Date; end: Date }) {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  exportData() {
    this.inProgress = true;
    this.cdr.markForCheck();

    this.statsService.getExportReport(this.startDate, this.endDate, this.selectedGroup)
      .subscribe({
        next: (data: ExportData[]) => {
          this.downloadCsv(data);
          this.inProgress = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.inProgress = false;
          this.cdr.markForCheck();
        }
      });
  }

  private downloadCsv(data: ExportData[]) {
    const header = 'date,hour,consumed_kwh';
    const rows = data.map(row => `${row.date},${row.hour},${row.consumed}`);
    const csv = [header, ...rows].join('\n');

    const groupName = this.groups.find(g => g.id === this.selectedGroup)?.name ?? this.selectedGroup;
    const from = this.formatDateForFilename(this.startDate);
    const to = this.formatDateForFilename(this.endDate);
    const filename = `export_${groupName}_${from}_${to}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private formatDateForFilename(date: Date): string {
    return new Intl.DateTimeFormat('en-CA').format(date);
  }

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
}
