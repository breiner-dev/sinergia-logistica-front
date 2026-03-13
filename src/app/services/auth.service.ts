import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/auth/login';
  private readonly tokenKey = 'auth_token';

  private tokenSignal = signal<string | null>(localStorage.getItem(this.tokenKey));

  readonly autenticado = computed(() => !!this.tokenSignal());

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        this.tokenSignal.set(response.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.tokenSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}