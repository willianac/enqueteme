import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { UserApi } from './services/user-api';
import { unauthGuard } from './unauth.guard';

describe('unauthGuard', () => {
  const user = signal<ReturnType<UserApi['user']>>(null);

  beforeEach(() => {
    user.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserApi, useValue: { user } },
      ],
    });
  });

  it('allows signed-out users and redirects authenticated users to /polls', () => {
    const signedOut = TestBed.runInInjectionContext(() =>
      unauthGuard({} as never, {} as never),
    );
    expect(signedOut).toBe(true);

    user.set({ id: 1, name: 'Will', email: 'will@example.com' });
    const signedIn = TestBed.runInInjectionContext(() =>
      unauthGuard({} as never, {} as never),
    ) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(signedIn)).toBe('/polls');
  });
});
