import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

export interface Patient {
  id?:                  number;
  name:                string;
  email:               string;
  phone:               string;
  medicalRecordNumber: string;
  diagnosis:           string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container animate-fade-in">
      <!-- Top Navigation Header -->
      <header class="dashboard-header">
        <div class="header-brand">
          <div class="logo-orb-small"></div>
          <div>
            <h2>AuraHealth Dashboard</h2>
            <span class="tenant-badge" [ngClass]="authService.tenantId() === 'tenant_a' ? 'badge-alpha' : 'badge-beta'">
              Active Clinic: {{ authService.tenantId() === 'tenant_a' ? 'Alpha Clinic' : 'Beta Hospital' }}
            </span>
          </div>
        </div>

        <div class="header-user">
          <div class="user-info">
            <span class="username">{{ authService.username() }}</span>
            <span class="role-badge">{{ authService.roles().includes('ROLE_ADMIN') ? 'System Admin' : 'Medical Doctor' }}</span>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="onLogout()">Logout</button>
        </div>
      </header>

      <!-- Main Layout -->
      <main class="dashboard-main">
        <div class="dashboard-grid">
          
          <!-- Column 1: Patient Search & Elasticsearch Panel -->
          <div class="grid-item card search-panel">
            <div class="panel-header">
              <h3>Secure Fuzzy Patient Search</h3>
              <p class="panel-subtitle">Powered by Elasticsearch CQRS Index</p>
            </div>
            
            <div class="form-group search-box">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Type name to start fuzzy search..." 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)">
              <span class="search-indicator" *ngIf="isSearching()">Searching index...</span>
            </div>

            <!-- Elasticsearch results -->
            <div class="search-results">
              <div *ngIf="searchResults().length === 0 && searchQuery.trim() !== ''" class="empty-state">
                No indexed patients found matching "{{ searchQuery }}"
              </div>
              
              <div *ngFor="let result of searchResults()" class="search-card">
                <div class="search-card-main">
                  <div>
                    <h4>{{ result.name }}</h4>
                    <span class="card-mrn">{{ result.medicalRecordNumber }}</span>
                  </div>
                  <span class="badge-es">Indexed</span>
                </div>
                <div class="search-card-details">
                  <p><strong>Diagnosis:</strong> {{ result.diagnosis }}</p>
                  <p><strong>Contact:</strong> {{ result.phone }} | {{ result.email }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Patient Registry Database -->
          <div class="grid-item card patient-panel">
            <div class="panel-header-action">
              <div>
                <h3>Registered Patients Directory</h3>
                <p class="panel-subtitle">Transactional PostgreSQL Isolated Schema</p>
              </div>
              
              <!-- Role-Based Access Control: Only admins can register patients -->
              <button 
                *ngIf="authService.hasRole('ROLE_ADMIN')" 
                class="btn btn-primary" 
                (click)="showRegisterModal.set(true)">
                + Register Patient
              </button>
            </div>

            <div class="table-container mt-20">
              <table class="table">
                <thead>
                  <tr>
                    <th>MRN</th>
                    <th>Full Name</th>
                    <th>Contact Info</th>
                    <th>Medical Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let patient of patients()">
                    <td><strong>{{ patient.medicalRecordNumber }}</strong></td>
                    <td>{{ patient.name }}</td>
                    <td>
                      <div>{{ patient.email }}</div>
                      <div class="text-small text-secondary">{{ patient.phone }}</div>
                    </td>
                    <td>
                      <span class="diagnosis-cell">{{ patient.diagnosis }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="patients().length === 0">
                    <td colspan="4" class="text-center text-muted">No database records found for this tenant.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      <!-- Register Patient Modal (ADMIN Role) -->
      <div class="modal-overlay" *ngIf="showRegisterModal()">
        <div class="card modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Register New Patient</h3>
            <button class="modal-close" (click)="showRegisterModal.set(false)">×</button>
          </div>
          <p class="modal-subtitle">Registering inside isolated schema: <strong>{{ authService.tenantId() }}</strong></p>
          
          <form (ngSubmit)="onRegisterSubmit()" #registerForm="ngForm" class="mt-20">
            <div class="form-group">
              <label class="form-label" for="p-name">Full Name</label>
              <input id="p-name" type="text" name="name" [(ngModel)]="newPatient.name" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="p-email">Email Address</label>
              <input id="p-email" type="email" name="email" [(ngModel)]="newPatient.email" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="p-phone">Phone Number</label>
              <input id="p-phone" type="text" name="phone" [(ngModel)]="newPatient.phone" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="p-mrn">Medical Record Number (MRN)</label>
              <input id="p-mrn" type="text" name="mrn" [(ngModel)]="newPatient.medicalRecordNumber" class="form-control" placeholder="e.g. MRN-A-2026" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="p-diag">Primary Diagnosis</label>
              <textarea id="p-diag" name="diagnosis" [(ngModel)]="newPatient.diagnosis" class="form-control" rows="3" required></textarea>
            </div>

            <div class="modal-actions mt-20">
              <button type="button" class="btn btn-secondary" (click)="showRegisterModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="registerForm.invalid">Save & Index Patient</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .dashboard-header {
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-orb-small {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
      border-radius: 50%;
    }

    .header-brand h2 {
      font-size: 18px;
      font-weight: 600;
    }

    .tenant-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      margin-top: 2px;
    }

    .badge-alpha {
      background-color: rgba(88, 101, 242, 0.15);
      color: #9aa5ff;
      border: 1px solid rgba(88, 101, 242, 0.3);
    }

    .badge-beta {
      background-color: rgba(0, 210, 138, 0.15);
      color: #72ffcb;
      border: 1px solid rgba(0, 210, 138, 0.3);
    }

    .header-user {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .user-info {
      text-align: right;
      display: flex;
      flex-direction: column;
    }

    .username {
      font-weight: 600;
      font-size: 14px;
    }

    .role-badge {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .btn-sm {
      padding: 6px 16px;
      font-size: 12px;
      border-radius: 6px;
    }

    .dashboard-main {
      flex: 1;
      padding: 32px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1.8fr;
      gap: 32px;
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .panel-header {
      margin-bottom: 20px;
    }

    .panel-header-action {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .panel-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .search-box {
      position: relative;
    }

    .search-indicator {
      position: absolute;
      right: 12px;
      top: 14px;
      font-size: 11px;
      color: var(--accent-secondary);
    }

    .search-results {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .search-card {
      background-color: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 14px;
    }

    .search-card-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .search-card-main h4 {
      font-size: 15px;
      font-weight: 600;
    }

    .card-mrn {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .badge-es {
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .search-card-details {
      margin-top: 10px;
      font-size: 12px;
      border-top: 1px dashed var(--border-color);
      padding-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .diagnosis-cell {
      background-color: rgba(255, 255, 255, 0.03);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      display: inline-block;
    }

    .mt-20 {
      margin-top: 20px;
    }

    .text-small {
      font-size: 12px;
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-card {
      width: 100%;
      max-width: 480px;
      background-color: var(--bg-secondary);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 28px;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Signals for Patients lists
  readonly patients = signal<Patient[]>([]);
  readonly searchResults = signal<any[]>([]);
  readonly isSearching = signal(false);
  readonly showRegisterModal = signal(false);

  // Microservice endpoints
  private readonly patientServiceUrl = 'http://localhost:8082/patients';
  private readonly searchServiceUrl = 'http://localhost:8083/search/patients/query';

  searchQuery = '';
  private searchSubject = new Subject<string>();

  newPatient: Patient = {
    name: '',
    email: '',
    phone: '',
    medicalRecordNumber: '',
    diagnosis: ''
  };

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.fetchPatients();

    // Set up Elasticsearch debounced query stream
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.isSearching.set(false);
          return of([]);
        }
        this.isSearching.set(true);
        return this.http.get<any[]>(`${this.searchServiceUrl}?name=${query}`);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.error('Error querying Elasticsearch:', err);
        this.isSearching.set(false);
      }
    });
  }

  fetchPatients(): void {
    this.http.get<Patient[]>(this.patientServiceUrl).subscribe({
      next: (data) => {
        this.patients.set(data);
      },
      error: (err) => {
        console.error('Failed to load patient directory:', err);
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onRegisterSubmit(): void {
    this.http.post<Patient>(this.patientServiceUrl, this.newPatient).subscribe({
      next: (savedPatient) => {
        this.showRegisterModal.set(false);
        this.fetchPatients();
        // Clear input form
        this.newPatient = {
          name: '',
          email: '',
          phone: '',
          medicalRecordNumber: '',
          diagnosis: ''
        };
      },
      error: (err) => {
        console.error('Error registering patient:', err);
        alert('Failed to register patient in database.');
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
