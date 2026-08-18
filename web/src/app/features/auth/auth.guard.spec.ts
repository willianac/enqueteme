import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { UserApi } from './services/user-api';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
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

  it('allows authenticated users and redirects signed-out users', () => {
    const signedOut = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(signedOut)).toBe('/signin');

    user.set({ id: 1, name: 'Will', email: 'will@example.com' });
    const signedIn = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(signedIn).toBe(true);
  });
});
