import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthRequest {
  username: string;
  password:  string;
  tenantId:  string;
}

export interface AuthResponse {
  token:     string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = 'http://localhost:8081/auth';

  // Angular Signals for reactive state
  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly tenantId = signal<string | null>(localStorage.getItem('tenantId'));
  readonly roles = signal<string[]>(JSON.parse(localStorage.getItem('roles') || '[]'));
  readonly username = signal<string | null>(localStorage.getItem('username'));

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap(response => {
        // Decode token to extract roles/details (simple JWT claim extraction)
        const payload = this.decodeTokenPayload(response.token);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('tenantId', credentials.tenantId);
        localStorage.setItem('username', credentials.username);
        localStorage.setItem('roles', JSON.stringify(payload.roles || []));

        this.token.set(response.token);
        this.tenantId.set(credentials.tenantId);
        this.username.set(credentials.username);
        this.roles.set(payload.roles || []);
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.token.set(null);
    this.tenantId.set(null);
    this.username.set(null);
    this.roles.set([]);
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  private decodeTokenPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return {};
      return JSON.parse(atob(parts[1]));
    } catch (e) {
      return {};
    }
  }
}
