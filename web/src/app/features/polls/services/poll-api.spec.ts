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

    service.setVote({ pollId: 1, optionIds: [2] }).subscribe();
    const vote = http.expectOne('/api/polls/vote');
    expect(vote.request.body).toEqual({ pollId: 1, optionIds: [2] });
    vote.flush({});
  });

  it('checks duplicate polls with title only', () => {
    service.checkDuplicate('React vs Vue').subscribe((result) => {
      expect(result.duplicateFound).toBe(true);
      expect(result.similarity).toBe(0.85);
      expect(result.poll?.id).toBe(42);
      expect(result.poll?.title).toBe('React vs Vue em 2026');
      expect(result.poll?.votesCount).toBe(184);
    });

    const req = http.expectOne(
      (r) => r.url === '/api/polls/check-duplicate' && r.params.get('title') === 'React vs Vue',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('options')).toBe(false);
    req.flush({
      duplicateFound: true,
      similarity: 0.85,
      poll: {
        id: 42,
        title: 'React vs Vue em 2026',
        votesCount: 184,
      },
    });
  });

  it('checks duplicate polls with title and draft options', () => {
    service.checkDuplicate('Melhor framework', ['React', 'Vue']).subscribe((result) => {
      expect(result.duplicateFound).toBe(false);
      expect(result.poll).toBeNull();
    });

    const req = http.expectOne(
      (r) =>
        r.url === '/api/polls/check-duplicate' &&
        r.params.get('title') === 'Melhor framework' &&
        r.params.get('options') === 'React,Vue',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      duplicateFound: false,
      similarity: 0,
      poll: null,
    });
  });
});
