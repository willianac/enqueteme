import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserApi } from '../../auth/services/user-api';

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
  userApi = inject(UserApi);

  private apiUrl = "http://localhost:8080/";

  public createPoll(createPollRequest: CreatePollRequest) {
    const user = this.userApi.user()

    return this.http.post<CreatePollResponse>(`${this.apiUrl}polls`, { 
      title: createPollRequest.title, 
      options: createPollRequest.options,
      voteRequireLogin: createPollRequest.voteRequireLogin,
      durationDays: createPollRequest.durationDays,
      userId: 1
    });
  }

  public getAllPolls() {
    return this.http.get<CreatePollResponse[]>(`${this.apiUrl}polls`);
  }
}
