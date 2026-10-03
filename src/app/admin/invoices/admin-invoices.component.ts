import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AdminApiService, Invoice } from '../admin-api.service';

@Component({
  selector: 'app-admin-invoices',
  imports: [DatePipe, DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <div>
        <h1 class="title">Invoices</h1>
        <p class="subtitle">Generate invoices with Razorpay QR + payment link, and send receipts on payment.</p>
      </div>
      <a class="k-btn" routerLink="/admin/invoices/new"><span class="material-icons">add</span> New invoice</a>
    </div>

    @if (loading()) {
      <div class="k-card">Loading…</div>
    } @else if (invoices().length === 0) {
      <div class="k-card empty">No invoices yet.</div>
    } @else {
      <div class="k-card table-card">
        <table>
          <thead>
            <tr><th>Invoice No</th><th>Type</th><th>Client</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            @for (inv of invoices(); track inv._id) {
              <tr (click)="open(inv)">
                <td class="mono">{{ inv.invoiceNo }}</td>
                <td>{{ inv.docType }}</td>
                <td>{{ inv.billTo?.businessName || '—' }}</td>
                <td>₹{{ inv.total | number: '1.2-2' }}</td>
                <td>
                  <span class="k-chip" [class.green]="inv.status === 'Paid'" [class.amber]="inv.status === 'Sent'" [class.grey]="inv.status === 'Draft'">{{ inv.status }}</span>
                </td>
                <td class="muted">{{ inv.createdAt | date: 'dd MMM, HH:mm' }}</td>
                <td (click)="$event.stopPropagation()">
                  <button class="k-btn danger sm" (click)="remove(inv)"><span class="material-icons">delete</span></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
    .title { font-size: 28px; }
    .subtitle { color: var(--k-ink-muted); margin: 4px 0 0; }
    .head .material-icons { font-size: 18px; }
    .empty { color: var(--k-ink-muted); }
    .table-card { padding: 0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 14px 16px; color: var(--k-ink-muted); font-weight: 500; border-bottom: 1px solid var(--k-hairline); white-space: nowrap; }
    td { padding: 14px 16px; border-bottom: 1px solid var(--k-hairline); }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: rgba(127,127,127,.08); }
    .mono { font-variant-numeric: tabular-nums; }
    .muted { color: var(--k-ink-muted); font-size: 12px; }
    .material-icons { font-size: 18px; }
  `]
})
export class AdminInvoicesComponent implements OnInit {
  private api = inject(AdminApiService);
  private router = inject(Router);
  invoices = signal<Invoice[]>([]);
  loading = signal(true);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getInvoices().subscribe({
      next: (res: { success: boolean; data: Invoice[] }) => { this.invoices.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  open(inv: Invoice): void { this.router.navigate(['/admin/invoices', inv._id]); }

  remove(inv: Invoice): void {
    if (!confirm(`Delete invoice ${inv.invoiceNo}?`)) return;
    this.api.deleteInvoice(inv._id).subscribe({ next: () => this.load() });
  }
}
