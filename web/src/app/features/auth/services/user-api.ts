import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private http = inject(HttpClient);
  private apiUrl = "http://localhost:8080/";
  
  public signIn(name: string) {
    return this.http.post<{ user: any }>(this.apiUrl + "user", { name });
  }
}
