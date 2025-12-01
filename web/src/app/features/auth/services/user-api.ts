import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

type User = {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:8080/";

  public readonly user = signal<User | null>(null);
  
  public signIn(name: string): Observable<User> {
    return this.http.post<User>(this.apiUrl + "user", { name }).pipe(
      tap((res) => this.user.set(res))
    )
  }
}
