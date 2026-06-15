import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper animate-fade-in">
      <div class="card login-card">
        <div class="brand-header">
          <div class="logo-orb"></div>
          <h1>AuraHealth</h1>
          <p>Enterprise Multi-Tenant EHR Portal</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="tenant">Select Hospital/Tenant</label>
            <select 
              id="tenant" 
              name="tenantId" 
              [(ngModel)]="credentials.tenantId" 
              class="form-control" 
              required>
              <option value="tenant_a">Alpha Clinic (Tenant A)</option>
              <option value="tenant_b">Beta Hospital (Tenant B)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input 
              id="username" 
              type="text" 
              name="username" 
              [(ngModel)]="credentials.username" 
              class="form-control" 
              placeholder="doctor_alpha"
              required>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              name="password" 
              [(ngModel)]="credentials.password" 
              class="form-control" 
              placeholder="••••••••"
              required>
          </div>

          <div *ngIf="errorMessage()" class="error-alert">
            {{ errorMessage() }}
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            [disabled]="loginForm.invalid || isLoading()">
            <span *ngIf="isLoading()">Authenticating...</span>
            <span *ngIf="!isLoading()">Access Workspace</span>
          </button>
        </form>
        
        <div class="login-footer">
          <p>Secure HIPAA & GDPR Compliant isolation layer active.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: radial-gradient(circle at 10% 20%, rgba(88, 101, 242, 0.1) 0%, transparent 40%);
    }

    .login-card {
      width: 100%;
      max-width: 420px;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-orb {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
      border-radius: 50%;
      margin: 0 auto 16px auto;
      box-shadow: 0 0 20px rgba(88, 101, 242, 0.4);
    }

    .brand-header h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .brand-header p {
      color: var(--text-secondary);
      font-size: 13px;
      margin-top: 4px;
    }

    .btn-block {
      width: 100%;
      margin-top: 10px;
    }

    .error-alert {
      background-color: rgba(255, 71, 87, 0.1);
      border: 1px solid var(--danger);
      color: var(--danger);
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 20px;
      text-align: center;
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .login-footer p {
      font-size: 11px;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  credentials = {
    username: '',
    password: '',
    tenantId: 'tenant_a'
  };

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error || 'Authentication failed. Please check credentials and Tenant ID.');
      }
    });
  }
}
