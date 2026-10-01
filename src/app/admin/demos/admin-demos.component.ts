import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminApiService, DemoLead } from '../admin-api.service';

@Component({
  selector: 'app-admin-demos',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="title">Demo Leads</h1>
    <p class="subtitle">Every demo booked via WhatsApp or the website contact form. Click a lead to view full details.</p>

    @if (loading()) {
      <div class="k-card">Loading…</div>
    } @else if (demos().length === 0) {
      <div class="k-card empty">No demo requests yet.</div>
    } @else {
      <div class="k-card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Business Name</th><th>WhatsApp Number</th><th>Category</th><th>Status</th><th class="ta-c">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (d of demos(); track d._id) {
              <tr (click)="openDetail(d)">
                <td>{{ d.name || '—' }}</td>
                <td class="biz">{{ d.businessName || '—' }}</td>
                <td>+{{ d.phone }}</td>
                <td>{{ d.category || '—' }}</td>
                <td>
                  <span class="k-chip" [class.green]="d.status === 'Completed'" [class.amber]="d.status === 'Contacted'" [class.grey]="d.status === 'New'">
                    {{ d.status }}
                  </span>
                </td>
                <td class="actions" (click)="$event.stopPropagation()">
                  <button class="ic wa" title="Open chat in CRM" (click)="openChat(d)"><span class="material-icons">chat</span></button>
                  @if (d.email) {
                    <a class="ic mail" title="Send email" [href]="'mailto:' + d.email"><span class="material-icons">mail</span></a>
                  }
                  <button class="ic del" title="Delete" (click)="remove(d)"><span class="material-icons">delete</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .title { font-size: 28px; }
    .subtitle { color: var(--k-ink-muted); margin: 4px 0 24px; }
    .empty { color: var(--k-ink-muted); }
    .table-card { padding: 0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 14px 16px; color: var(--k-ink-muted); font-weight: 500; border-bottom: 1px solid var(--k-hairline); white-space: nowrap; }
    th.ta-c { text-align: center; }
    td { padding: 14px 16px; border-bottom: 1px solid var(--k-hairline); vertical-align: middle; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: rgba(127,127,127,.08); }
    tr:last-child td { border-bottom: none; }
    .biz { font-weight: 500; }
    .actions { display: flex; gap: 8px; justify-content: center; }
    .ic { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--k-hairline); background: transparent; cursor: pointer; color: var(--k-ink-muted); }
    .ic .material-icons { font-size: 18px; }
    .ic.wa:hover { color: var(--k-green); border-color: var(--k-green); }
    .ic.mail:hover { color: #60a5fa; border-color: #60a5fa; }
    .ic.del:hover { color: var(--k-danger); border-color: var(--k-danger); }
  `]
})
export class AdminDemosComponent implements OnInit {
  private api = inject(AdminApiService);
  private router = inject(Router);
  demos = signal<DemoLead[]>([]);
  loading = signal(true);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getDemos().subscribe({
      next: (res: { success: boolean; data: DemoLead[] }) => { this.demos.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openDetail(d: DemoLead): void {
    this.router.navigate(['/admin/demos', d._id]);
  }

  openChat(d: DemoLead): void {
    this.router.navigate(['/admin/crm'], { queryParams: { phone: d.phone } });
  }

  remove(d: DemoLead): void {
    if (!confirm(`Delete demo lead for "${d.businessName || d.phone}"?`)) return;
    this.api.deleteDemo(d._id).subscribe({ next: () => this.load() });
  }
}
