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

  it('requests /api/polls?page=1&limit=10 when no discovery filters are active', () => {
    service.getAllPolls(1, 10).subscribe();
    const req = http.expectOne('/api/polls?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('appends category, normalized tag, search, and sort query params in getAllPolls', () => {
    service
      .getAllPolls(2, 10, {
        category: 'Tecnologia',
        tag: ' #Angular ',
        search: ' framework ',
        sort: 'trending',
      })
      .subscribe();

    const req = http.expectOne(
      '/api/polls?page=2&limit=10&category=Tecnologia&tag=angular&search=framework&sort=trending',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('includes category and tags in createPoll and updatePoll', () => {
    service
      .createPoll({
        title: 'Qual stack?',
        options: ['Angular', 'React'],
        category: 'Tecnologia',
        tags: ['angular', 'frontend'],
        voteRequireLogin: true,
        durationDays: 5,
      })
      .subscribe();

    const create = http.expectOne('/api/polls');
    expect(create.request.body).toEqual({
      title: 'Qual stack?',
      options: ['Angular', 'React'],
      category: 'Tecnologia',
      tags: ['angular', 'frontend'],
      voteRequireLogin: true,
      pollExpirationInDays: 5,
    });
    create.flush({});

    service
      .updatePoll(10, {
        title: 'Qual stack atualizado?',
        options: ['Angular', 'React'],
        category: 'Design',
        tags: ['ui', 'ux'],
      })
      .subscribe();

    const update = http.expectOne('/api/polls/10');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({
      title: 'Qual stack atualizado?',
      options: ['Angular', 'React'],
      category: 'Design',
      tags: ['ui', 'ux'],
    });
    update.flush({});
  });
});
