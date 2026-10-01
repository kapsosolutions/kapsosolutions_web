import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService, DemoLead } from '../admin-api.service';
import { KDropdownComponent, KOption } from '../ui/k-dropdown.component';

@Component({
  selector: 'app-admin-demo-detail',
  imports: [DatePipe, FormsModule, RouterLink, KDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back" routerLink="/admin/demos"><span class="material-icons">arrow_back</span> Back to demo leads</a>

    @if (loading()) {
      <div class="k-card">Loading…</div>
    } @else if (!lead()) {
      <div class="k-card empty">Lead not found.</div>
    } @else {
      <div class="head">
        <div class="avatar">{{ initials() }}</div>
        <div class="head-info">
          <h1>{{ lead()!.businessName || lead()!.name || ('+' + lead()!.phone) }}</h1>
          <p class="muted">Booked {{ lead()!.createdAt | date: 'dd MMM yyyy, HH:mm' }} · via {{ lead()!.source }}</p>
        </div>
        <div class="head-actions">
          <button class="k-btn" (click)="openChat()"><span class="material-icons">chat</span> Open WhatsApp chat</button>
          @if (lead()!.email) {
            <a class="k-btn ghost" [href]="'mailto:' + lead()!.email"><span class="material-icons">mail</span> Email</a>
          }
        </div>
      </div>

      <div class="grid">
        <div class="k-card">
          <h2>Lead details</h2>
          <div class="rows">
            <div class="row"><span class="lbl">Name</span><span class="val">{{ lead()!.name || '—' }}</span></div>
            <div class="row"><span class="lbl">Business name</span><span class="val">{{ lead()!.businessName || '—' }}</span></div>
            <div class="row"><span class="lbl">Business address</span><span class="val">{{ lead()!.businessAddress || '—' }}</span></div>
            <div class="row"><span class="lbl">Category</span><span class="val">{{ lead()!.category || '—' }}</span></div>
            <div class="row">
              <span class="lbl">WhatsApp number</span>
              <span class="val link" (click)="openChat()">+{{ lead()!.phone }} <span class="material-icons">open_in_new</span></span>
            </div>
            <div class="row"><span class="lbl">Alternate mobile</span><span class="val">{{ lead()!.altMobile || '—' }}</span></div>
            <div class="row">
              <span class="lbl">Email</span>
              @if (lead()!.email) {
                <a class="val link" [href]="'mailto:' + lead()!.email">{{ lead()!.email }}</a>
              } @else { <span class="val">—</span> }
            </div>
            <div class="row"><span class="lbl">Source</span><span class="val">{{ lead()!.source }}</span></div>
          </div>
        </div>

        <div class="k-card status-card">
          <h2>Status</h2>
          <k-dropdown
            [options]="statusOptions"
            [ngModel]="lead()!.status"
            (ngModelChange)="changeStatus($event)"
          ></k-dropdown>
          @if (saved()) { <p class="ok">Status updated</p> }
        </div>
      </div>
    }
  `,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--k-ink-muted); font-size: 14px; margin-bottom: 18px; }
    .back .material-icons { font-size: 18px; }
    .back:hover { color: var(--k-green); }
    .empty { color: var(--k-ink-muted); }
    .head { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
    .avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--k-green); color: #06210f; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; }
    .head-info { flex: 1; min-width: 180px; }
    .head-info h1 { font-size: 24px; }
    .muted { color: var(--k-ink-muted); font-size: 13px; margin-top: 2px; }
    .head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .head-actions .material-icons { font-size: 18px; }
    .grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
    h2 { font-size: 18px; margin-bottom: 16px; }
    .rows { display: flex; flex-direction: column; }
    .row { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--k-hairline); }
    .row:last-child { border-bottom: none; }
    .lbl { width: 150px; flex-shrink: 0; color: var(--k-ink-muted); font-size: 14px; }
    .val { font-size: 15px; word-break: break-word; }
    .val.link { color: var(--k-green); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .val.link .material-icons { font-size: 15px; }
    .ok { color: #4ade80; font-size: 13px; margin-top: 10px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminDemoDetailComponent implements OnInit {
  private api = inject(AdminApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lead = signal<DemoLead | null>(null);
  loading = signal(true);
  saved = signal(false);

  statusOptions: KOption[] = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Completed', label: 'Completed' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.api.getDemo(id).subscribe({
      next: (res: { success: boolean; data: DemoLead }) => { this.lead.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  initials(): string {
    const l = this.lead();
    const s = l?.businessName || l?.name || l?.phone || '';
    return s.replace('+', '').trim().slice(0, 2).toUpperCase();
  }

  changeStatus(status: string): void {
    const l = this.lead();
    if (!l || status === l.status) return;
    this.api.setDemoStatus(l._id, status).subscribe({
      next: (res: { success: boolean; data: DemoLead }) => {
        if (res.success) {
          this.lead.set(res.data);
          this.saved.set(true);
          setTimeout(() => this.saved.set(false), 2000);
        }
      }
    });
  }

  openChat(): void {
    const l = this.lead();
    if (l) this.router.navigate(['/admin/crm'], { queryParams: { phone: l.phone } });
  }
}
