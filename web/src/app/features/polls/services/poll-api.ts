import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PollType } from '../../../shared/types/Poll';
import { Observable } from 'rxjs';

type CreatePollResponse = {
  pollId: string;
  title: string;
  options: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

type CreatePollRequest = {
  title: string;
  options: string[];
  voteRequireLogin?: boolean;
  durationDays?: number;
}

type SetVoteRequest = {
  pollId: number;
  optionId: number;
}

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
    });
  }

  public getAllPolls() {
    return this.http.get<PollType[]>(`${this.apiUrl}polls`);
  }

  public setVote(setVoteRequest: SetVoteRequest): Observable<PollType> {
    return this.http.post<PollType>(`${this.apiUrl}polls/vote`, {
      pollId: setVoteRequest.pollId,
      optionId: setVoteRequest.optionId,
    })
  }
}
