export type AIReportLanguage = 'es' | 'en';
export type AIReportStatus = 'running' | 'done' | 'failed';
export type AIAnalysisStatus = 'ok' | 'attention' | 'critical';
export type AIFindingSeverity = 'critical' | 'warning' | 'info';

export interface AIModelOption {
  id: string;
  label: string;
  /** USD per million tokens */
  input_price: number;
  cached_price: number;
  output_price: number;
}

export interface AIReportSettings {
  enabled: boolean;
  model: string;
  reasoning_effort: string;
  max_output_tokens: number;
  /** Empty means the built-in prompt. */
  system_prompt: string;
  /** 0 = Sunday */
  weekday: number;
  hour: number;
  time_zone: string;
  period_days: number;
  monthly_budget_usd: number;
  last_scheduled_run?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AIReportSettingsView extends AIReportSettings {
  has_api_key: boolean;
  mail_enabled: boolean;
  default_system_prompt: string;
  models: AIModelOption[];
  languages: AIReportLanguage[];
  next_run?: string;
  month_spent_usd: number;
  recipients: number;
}

export type AIReportSettingsUpdate = Partial<Omit<AIReportSettings, 'last_scheduled_run' | 'updated_at' | 'updated_by'>>;

export interface AIReportRunRequest {
  dry_run?: boolean;
  language?: AIReportLanguage;
  email?: string;
  send_all?: boolean;
  /** Empty or absent: the whole network. */
  location_ids?: string[];
}

export interface AIFinding {
  severity: AIFindingSeverity;
  area: string;
  charge_point_id: string;
  title: string;
  details: string;
  recommendation: string;
}

export type AIActionPriority = 'urgent' | 'priority' | 'planned';

/** One row of the executive diagnosis: a charge point or an area, one sentence. */
export interface AIDiagnosis {
  subject: string;
  text: string;
}

/** One row of the action plan. */
export interface AIAction {
  priority: AIActionPriority;
  target: string;
  action: string;
}

/**
 * The model's answer. Compact reports carry diagnosis/actions/closing_note;
 * reports generated before the compact layout carry summary/findings/trends
 * (null on newer ones).
 */
export interface AIAnalysisResult {
  status: AIAnalysisStatus;
  headline: string;
  diagnosis?: AIDiagnosis[];
  actions?: AIAction[];
  closing_note?: string;
  summary: string;
  findings: AIFinding[] | null;
  trends: string[] | null;
}

/** One set of locations a run analysed; key "" is the whole network. */
export interface AIReportScope {
  key: string;
  location_ids?: string[];
  locations?: string[];
  /** JSON the model read; only in the single-report response. */
  snapshot?: string;
  snapshot_bytes: number;
}

export interface AIAnalysis {
  /** Key of the AIReportScope the answer is about; absent on old reports. */
  scope?: string;
  language: AIReportLanguage;
  result?: AIAnalysisResult;
  response_id?: string;
  error?: string;
}

export interface AIReportDelivery {
  scope?: string;
  email: string;
  language: AIReportLanguage;
  sent_at: string;
  error?: string;
}

export interface AIReport {
  id: string;
  trigger: 'schedule' | 'manual' | 'test';
  author?: string;
  dry_run: boolean;
  status: AIReportStatus;
  error?: string;
  period_from: string;
  period_to: string;
  time_zone: string;
  model?: string;
  created_at: string;
  finished_at?: string;
  /** Whole-network snapshot of reports older than location filters. */
  snapshot?: string;
  snapshot_bytes: number;
  scopes?: AIReportScope[];
  analyses?: AIAnalysis[];
  deliveries?: AIReportDelivery[];
  cost_usd: number;
}

export interface AIReportPreview {
  scope: string;
  language: AIReportLanguage;
  subject: string;
  html: string;
}

export interface AIUsage {
  id: string;
  time: string;
  trigger: string;
  report_id?: string;
  model: string;
  language?: string;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cost_usd: number;
  duration_ms: number;
  success: boolean;
  error?: string;
}

export interface AIUsageTotals {
  requests: number;
  failed: number;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cost_usd: number;
}

export interface AIUsageMonth extends AIUsageTotals {
  month: string;
}

export interface AIUsageReport {
  from: string;
  to: string;
  totals: AIUsageTotals;
  months: AIUsageMonth[] | null;
  models: Record<string, AIUsageTotals>;
  records: AIUsage[] | null;
}
