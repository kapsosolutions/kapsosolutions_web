import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AdminApiService } from '../admin-api.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'admin-shell', 'data-lenis-prevent': '' },
  template: `
    <div class="wrap">
      <aside class="sidebar" [class.open]="menuOpen()">
        <div class="brand">
          <img src="favicon.png" alt="Kapso Solutions" class="brand-logo" />
          <span class="brand-name">Kapso Admin</span>
        </div>
        <nav class="nav">
          <a routerLink="dashboard" routerLinkActive="active" (click)="close()">
            <span class="material-icons">dashboard</span> Dashboard
          </a>
          <a routerLink="crm" routerLinkActive="active" (click)="close()">
            <span class="material-icons">forum</span> CRM Chats
          </a>
          <a routerLink="demos" routerLinkActive="active" (click)="close()">
            <span class="material-icons">event_available</span> Demo Leads
          </a>
          <a routerLink="categories" routerLinkActive="active" (click)="close()">
            <span class="material-icons">category</span> Categories
          </a>
          <a routerLink="flow-images" routerLinkActive="active" (click)="close()">
            <span class="material-icons">image</span> Flow Images
          </a>
        </nav>
        <button class="k-btn ghost logout" (click)="logout()">
          <span class="material-icons">logout</span> Logout
        </button>
      </aside>

      <main class="content">
        <header class="topbar">
          <button class="hamburger" (click)="toggle()" aria-label="Menu">
            <span class="material-icons">menu</span>
          </button>
        </header>
        <div class="page" [class.full-bleed]="fullBleed()">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .wrap { display: flex; height: calc(100vh / 0.9); overflow: hidden; }
    .sidebar {
      width: 250px; flex-shrink: 0; background: #000; color: #fff;
      padding: 22px 16px; display: flex; flex-direction: column; gap: 8px;
      height: calc(100vh / 0.9); overflow-y: auto;
    }
    .brand { display: flex; align-items: center; gap: 10px; padding: 6px 8px 20px; }
    .brand-logo { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; background:#fff; }
    .brand-name { font-size: 16px; color: #fff; }
    .nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .nav a {
      display: flex; align-items: center; gap: 12px; padding: 11px 14px;
      border-radius: 50px; color: rgba(255,255,255,.72); font-size: 14px;
    }
    .nav a .material-icons { font-size: 20px; }
    .nav a:hover { background: rgba(255,255,255,.08); color: #fff; }
    .nav a.active { background: var(--k-green); color: var(--k-ink); }
    .logout { color:#fff; border-color: rgba(255,255,255,.3); }
    .content { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: var(--k-canvas); }
    .topbar {
      display: none; height: 56px; align-items: center; gap: 12px; padding: 0 16px;
      background: var(--k-canvas); border-bottom: 1px solid var(--k-hairline); position: sticky; top: 0; z-index: 5;
    }
    .hamburger { display: inline-flex; background: none; border: none; cursor: pointer; color: var(--k-ink); }
    .page { padding: 28px; flex: 1; min-height: 0; overflow-y: auto; }
    .page.full-bleed { padding: 0; display: flex; min-height: 0; overflow: hidden; }
    @media (max-width: 900px) {
      .topbar { display: flex; }
      .sidebar {
        position: fixed; z-index: 40; left: 0; top: 0; transform: translateX(-100%);
        transition: transform .25s ease;
      }
      .sidebar.open { transform: translateX(0); }
    }
  `]
})
export class AdminLayoutComponent {
  private api = inject(AdminApiService);
  private router = inject(Router);
  menuOpen = signal(false);
  // The CRM route runs edge-to-edge (no page padding / card box).
  fullBleed = signal(this.router.url.includes('/admin/crm'));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.fullBleed.set(e.urlAfterRedirects.includes('/admin/crm')));
  }

  toggle(): void { this.menuOpen.update((v) => !v); }
  close(): void { this.menuOpen.set(false); }

  logout(): void {
    this.api.setToken(null);
    this.router.navigate(['/admin/login']);
  }
}
