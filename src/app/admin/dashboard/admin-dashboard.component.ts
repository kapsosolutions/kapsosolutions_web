import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../admin-api.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="title">Dashboard</h1>
    <p class="subtitle">Overview of your WhatsApp demo funnel.</p>

    <div class="stats">
      <div class="k-card stat">
        <span class="material-icons">event_available</span>
        <div class="num">{{ stats().totalDemos }}</div>
        <div class="lbl">Total demo requests</div>
      </div>
      <div class="k-card stat">
        <span class="material-icons">fiber_new</span>
        <div class="num">{{ stats().newDemos }}</div>
        <div class="lbl">New (uncontacted)</div>
      </div>
      <div class="k-card stat">
        <span class="material-icons">category</span>
        <div class="num">{{ stats().totalCategories }}</div>
        <div class="lbl">Categories</div>
      </div>
    </div>

    <div class="quick">
      <a class="k-btn" routerLink="../crm"><span class="material-icons">forum</span> Open CRM</a>
      <a class="k-btn ghost" routerLink="../demos"><span class="material-icons">list</span> View demo leads</a>
      <a class="k-btn ghost" routerLink="../categories"><span class="material-icons">add</span> Manage categories</a>
    </div>
  `,
  styles: [`
    .title { font-size: 28px; }
    .subtitle { color: var(--k-ink-muted); margin: 4px 0 24px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin-bottom: 24px; }
    .stat .material-icons { color: var(--k-green); font-size: 28px; }
    .stat .num { font-size: 40px; margin: 8px 0 2px; }
    .stat .lbl { color: var(--k-ink-muted); font-size: 14px; }
    .quick { display: flex; flex-wrap: wrap; gap: 12px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(AdminApiService);
  stats = signal({ totalDemos: 0, newDemos: 0, totalCategories: 0 });

  ngOnInit(): void {
    this.api.stats().subscribe({
      next: (res: { success: boolean; stats: { totalDemos: number; newDemos: number; totalCategories: number } }) => { if (res.success) this.stats.set(res.stats); },
      error: () => { /* leave zeros */ }
    });
  }
}
