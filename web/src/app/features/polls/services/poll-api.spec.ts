import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PollApi } from './poll-api';

describe('PollApi', () => {
  let service: PollApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PollApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does not send client-controlled user identifiers', () => {
    service
      .createPoll({
        title: 'Question?',
        options: ['A', 'B'],
        voteRequireLogin: true,
        durationDays: 7,
      })
      .subscribe();

    const create = http.expectOne('/api/polls');
    expect(create.request.body).toEqual({
      title: 'Question?',
      options: ['A', 'B'],
      voteRequireLogin: true,
      pollExpirationInDays: 7,
    });
    create.flush({});

    service.setVote({ pollId: 1, optionId: 2 }).subscribe();
    const vote = http.expectOne('/api/polls/vote');
    expect(vote.request.body).toEqual({ pollId: 1, optionId: 2 });
    vote.flush({});
  });
});
