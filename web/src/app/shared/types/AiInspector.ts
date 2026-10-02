export type BiasIssueType =
  | 'leading_question'
  | 'missing_alternatives'
  | 'missing_escape_hatch'
  | 'other';

export type BiasIssueSeverity = 'critical' | 'warning' | 'info';

export interface BiasInspectorIssue {
  type: BiasIssueType;
  severity: BiasIssueSeverity;
  title: string;
  description: string;
  suggestion?: string;
}

export interface InspectPollBiasResponse {
  isNeutral: boolean;
  score: number; // 0 to 100
  summary: string;
  issues: BiasInspectorIssue[];
  suggestedTitle?: string | null;
  suggestedOptionsToAdd?: string[];
}

export interface GeneratePollRequest {
  prompt: string;
  currentOptions?: string[];
}

export interface GeneratePollResponse {
  title: string;
  options: string[];
}

