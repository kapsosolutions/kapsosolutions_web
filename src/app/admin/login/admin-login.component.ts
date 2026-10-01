import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApiService } from '../admin-api.service';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'admin-shell' },
  template: `
    <div class="login-wrap">
      <div class="k-card login-card">
        <img src="logo.png" alt="Kapso Solutions" class="logo" />
        <h1>Kapso Admin</h1>
        <p class="sub">Sign in to manage your WhatsApp console</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="k-field">
            <label class="k-label" for="username">Username</label>
            <input id="username" class="k-input" type="text" formControlName="username" autocomplete="username" />
          </div>
          <div class="k-field">
            <label class="k-label" for="password">Password</label>
            <input id="password" class="k-input" type="password" formControlName="password" autocomplete="current-password" />
          </div>

          @if (error()) {
            <p class="err">{{ error() }}</p>
          }

          <button class="k-btn" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { min-height: calc(100vh / 0.9); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .login-card { width: 100%; max-width: 380px; text-align: center; }
    .logo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; margin-bottom: 14px; }
    h1 { font-size: 26px; margin-bottom: 4px; }
    .sub { color: var(--k-ink-muted); font-size: 14px; margin-bottom: 24px; }
    form { text-align: left; }
    .k-btn { width: 100%; margin-top: 6px; }
    .err { color: var(--k-danger); font-size: 13px; margin-bottom: 12px; }
  `]
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private api = inject(AdminApiService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.api.login(username, password).subscribe({
      next: (res: { success: boolean; token: string }) => {
        this.loading.set(false);
        if (res.success && res.token) {
          this.api.setToken(res.token);
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error.set('Invalid credentials');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid credentials');
      }
    });
  }
}
