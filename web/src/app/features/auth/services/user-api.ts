import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
  
  public signIn(name: string): Observable<User> {
    return this.http.post<User>(this.apiUrl + "user", { name })
  }
}
