import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
  AIReport,
  AIReportPreview,
  AIReportRunRequest,
  AIReportSettingsUpdate,
  AIReportSettingsView,
  AIUsage,
  AIUsageReport,
} from '../models/ai-report';

/** Admin API of the weekly AI analysis. */
@Injectable({
  providedIn: 'root'
})
export class AIReportService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return environment.apiUrl + '/ai';
  }

  settings(): Observable<AIReportSettingsView> {
    return this.http.get<AIReportSettingsView>(`${this.baseUrl}/settings`);
  }

  updateSettings(update: AIReportSettingsUpdate): Observable<AIReportSettingsView> {
    return this.http.put<AIReportSettingsView>(`${this.baseUrl}/settings`, update);
  }

  test(): Observable<AIUsage> {
    return this.http.post<AIUsage>(`${this.baseUrl}/test`, {});
  }

  run(request: AIReportRunRequest): Observable<AIReport> {
    return this.http.post<AIReport>(`${this.baseUrl}/reports/run`, request);
  }

  reports(limit = 30): Observable<AIReport[] | null> {
    return this.http.get<AIReport[] | null>(`${this.baseUrl}/reports`, {params: {limit}});
  }

  report(id: string): Observable<AIReport> {
    return this.http.get<AIReport>(`${this.baseUrl}/reports/${encodeURIComponent(id)}`);
  }

  preview(id: string, scope: string, language: string): Observable<AIReportPreview> {
    return this.http.get<AIReportPreview>(`${this.baseUrl}/reports/${encodeURIComponent(id)}/preview`, {params: {scope, language}});
  }

  usage(from?: string, to?: string): Observable<AIUsageReport> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<AIUsageReport>(`${this.baseUrl}/usage`, {params});
  }
}
