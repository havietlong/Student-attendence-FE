import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { variables } from '../variables';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = variables.apiUrl;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ access_token: string; user: any }>(
      `${this.apiUrl}/auth/login`,
      { email, password },
      { withCredentials: true } // optional, only needed if using cookies
    ).pipe(
      tap((res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
