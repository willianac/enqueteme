import { TestBed } from '@angular/core/testing';

import { PollApi } from './poll-api';

describe('PollApi', () => {
  let service: PollApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PollApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
