import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root',
})
export class PollApi {
  http = inject(HttpClient);
  private apiUrl = "http://localhost:8080/";
  private userId = 1

  public createPoll(createPollRequest: CreatePollRequest) {
    return this.http.post<CreatePollResponse>(`${this.apiUrl}polls`, { 
      title: createPollRequest.title, 
      options: createPollRequest.options,
      voteRequireLogin: createPollRequest.voteRequireLogin,
      durationDays: createPollRequest.durationDays,
      userId: this.userId
    });
  }
}
