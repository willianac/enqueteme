import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

export type User = {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private http = inject(HttpClient);
  private apiUrl = '/api/';

  public readonly user = signal<User | null>(null);
  
  public restore(): Observable<User | null> {
    return this.http.get<User>(this.apiUrl + 'auth/me').pipe(
      tap((res) => this.user.set(res)),
      catchError(() => {
        this.user.set(null);
        return of(null);
      })
    );
  }

  public logout(): Observable<void> {
    return this.http.post<void>(this.apiUrl + 'auth/logout', {}).pipe(
      tap(() => this.user.set(null))
    );
  }
}
