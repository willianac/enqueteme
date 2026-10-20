import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PollType } from '../../../shared/types/Poll';
import {
  ExplainPollDebateRequest,
  ExplainPollDebateResponse,
  GeneratePollFromContentResponse,
  GeneratePollRequest,
  GeneratePollResponse,
  InspectPollBiasResponse,
} from '../../../shared/types/AiInspector';
import { Observable } from 'rxjs';

export interface DuplicatePollCheckResult {
  duplicateFound: boolean;
  similarity: number;
  poll: {
    id: number;
    title: string;
    votesCount: number;
  } | null;
}

type CreatePollResponse = {
  pollId: string;
  title: string;
  options: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CreatePollRequest = {
  title: string;
  options: string[];
  voteRequireLogin?: boolean;
  durationDays?: number;
  allowMultiple?: boolean;
  maxChoices?: number;
};

export type SetVoteRequest = {
  pollId: number;
  optionIds: number[];
};

export type UpdatePollRequest = {
  title: string;
  options: string[];
  voteRequireLogin?: boolean;
  pollExpirationInDays?: number;
  allowMultiple?: boolean;
  maxChoices?: number | null;
};

@Injectable({
  providedIn: 'root',
})
export class PollApi {
  http = inject(HttpClient);

  private apiUrl = '/api/';

  public createPoll(createPollRequest: CreatePollRequest) {
    return this.http.post<CreatePollResponse>(`${this.apiUrl}polls`, {
      title: createPollRequest.title,
      options: createPollRequest.options,
      voteRequireLogin: createPollRequest.voteRequireLogin,
      pollExpirationInDays: createPollRequest.durationDays,
      allowMultiple: createPollRequest.allowMultiple,
      maxChoices: createPollRequest.maxChoices,
    });
  }

  public getAllPolls(page = 1, limit = 10) {
    return this.http.get<PollType[]>(`${this.apiUrl}polls?page=${page}&limit=${limit}`);
  }

  public getPoll(id: number) {
    return this.http.get<PollType>(`${this.apiUrl}polls/${id}`);
  }

  public setVote(setVoteRequest: SetVoteRequest): Observable<PollType> {
    return this.http.post<PollType>(`${this.apiUrl}polls/vote`, {
      pollId: setVoteRequest.pollId,
      optionIds: setVoteRequest.optionIds,
    });
  }

  public getMyPolls(): Observable<PollType[]> {
    return this.http.get<PollType[]>(`${this.apiUrl}polls/mine`);
  }

  public updatePoll(id: number, request: UpdatePollRequest): Observable<PollType> {
    return this.http.patch<PollType>(`${this.apiUrl}polls/${id}`, request);
  }

  public closePoll(id: number): Observable<PollType> {
    return this.http.patch<PollType>(`${this.apiUrl}polls/${id}/close`, {});
  }

  public deletePoll(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}polls/${id}`);
  }

  public checkDuplicate(
    title: string,
    options?: string[],
  ): Observable<DuplicatePollCheckResult> {
    let params = new HttpParams().set('title', title);
    const validOptions = (options || []).filter((opt) => opt && opt.trim().length > 0);
    if (validOptions.length > 0) {
      params = params.set('options', validOptions.join(','));
    }
    return this.http.get<DuplicatePollCheckResult>(`${this.apiUrl}polls/check-duplicate`, {
      params,
    });
  }

  public inspectPollBias(request: {
    title: string;
    options: string[];
  }): Observable<InspectPollBiasResponse> {
    return this.http.post<InspectPollBiasResponse>(`${this.apiUrl}ai/inspect-bias`, request);
  }

  public generatePoll(request: GeneratePollRequest): Observable<GeneratePollResponse> {
    return this.http.post<GeneratePollResponse>(`${this.apiUrl}ai/generate-poll`, request);
  }

  public generatePollFromContent(
    type: 'url' | 'text',
    content: string,
  ): Observable<GeneratePollFromContentResponse> {
    return this.http.post<GeneratePollFromContentResponse>(
      `${this.apiUrl}ai/generate-from-content`,
      { type, content },
    );
  }

  public explainPollDebate(
    request: ExplainPollDebateRequest,
  ): Observable<ExplainPollDebateResponse> {
    return this.http.post<ExplainPollDebateResponse>(
      `${this.apiUrl}ai/explain-poll`,
      request,
    );
  }
}
