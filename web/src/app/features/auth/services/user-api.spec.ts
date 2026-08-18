import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserApi } from './user-api';

describe('UserApi', () => {
  let service: UserApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('restores and clears the current user session', () => {
    const user = { id: 1, name: 'Will', email: 'will@example.com' };

    service.restore().subscribe((result) => expect(result).toEqual(user));
    http.expectOne('/api/auth/me').flush(user);
    expect(service.user()).toEqual(user);

    service.logout().subscribe();
    http.expectOne('/api/auth/logout').flush(null);
    expect(service.user()).toBeNull();
  });

  it('treats an unauthorized restore as a signed-out user', () => {
    service.restore().subscribe((result) => expect(result).toBeNull());
    http
      .expectOne('/api/auth/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(service.user()).toBeNull();
  });
});
