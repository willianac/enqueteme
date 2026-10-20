export interface PollOptionDebateAnalysis {
  name: string;
  pros: string[];
  cons: string[];
}

export interface ExplainPollDebateResponse {
  pollId: number;
  overview: string;
  options: PollOptionDebateAnalysis[];
}
