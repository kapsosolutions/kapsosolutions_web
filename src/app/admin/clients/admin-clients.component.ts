import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, Client } from '../admin-api.service';

@Component({
  selector: 'app-admin-clients',
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="title">Clients</h1>
    <p class="subtitle">Add paying clients and their deal details, then generate invoices with Razorpay payment.</p>

    <div class="grid">
      <!-- Add / edit form -->
      <div class="k-card form-card">
        <h2>{{ editingId() ? 'Edit client' : 'Add client' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="k-field">
            <label class="k-label">Business name *</label>
            <input class="k-input" type="text" formControlName="businessName" placeholder="e.g. Sneha Super Market" />
          </div>
          <div class="k-field">
            <label class="k-label">Category</label>
            <input class="k-input" type="text" formControlName="category" placeholder="e.g. Retail" />
          </div>
          <div class="two">
            <div class="k-field">
              <label class="k-label">WhatsApp number</label>
              <input class="k-input" type="tel" formControlName="whatsapp" placeholder="91XXXXXXXXXX" />
            </div>
            <div class="k-field">
              <label class="k-label">Phone number</label>
              <input class="k-input" type="tel" formControlName="phone" />
            </div>
          </div>
          <div class="k-field">
            <label class="k-label">Email</label>
            <input class="k-input" type="email" formControlName="email" />
          </div>
          <div class="k-field">
            <label class="k-label">Address</label>
            <input class="k-input" type="text" formControlName="address" placeholder="e.g. Andhra Pradesh" />
          </div>
          <div class="two">
            <div class="k-field">
              <label class="k-label">Setup cost (₹)</label>
              <input class="k-input" type="number" formControlName="setupCost" />
            </div>
            <div class="k-field">
              <label class="k-label">Per-month charge (₹)</label>
              <input class="k-input" type="number" formControlName="monthlyCharge" />
            </div>
          </div>
          <div class="k-field">
            <label class="k-label">Notes</label>
            <input class="k-input" type="text" formControlName="notes" />
          </div>

          @if (error()) { <p class="err">{{ error() }}</p> }
          <div class="actions">
            <button class="k-btn" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : (editingId() ? 'Update client' : 'Add client') }}
            </button>
            @if (editingId()) { <button class="k-btn ghost" type="button" (click)="resetForm()">Cancel</button> }
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="list">
        @if (loading()) {
          <div class="k-card">Loading…</div>
        } @else if (clients().length === 0) {
          <div class="k-card empty">No clients yet. Add your first client.</div>
        } @else {
          @for (c of clients(); track c._id) {
            <div class="k-card row">
              <div class="meta">
                <div class="name">{{ c.businessName }}</div>
                <div class="sub">
                  @if (c.category) { <span class="chip">{{ c.category }}</span> }
                  @if (c.whatsapp) { <span>wa: +{{ c.whatsapp }}</span> }
                  @if (c.email) { <span>{{ c.email }}</span> }
                </div>
                <div class="deal">
                  <span>Setup <strong>₹{{ c.setupCost | number }}</strong></span>
                  <span>Monthly <strong>₹{{ c.monthlyCharge | number }}</strong></span>
                </div>
              </div>
              <div class="row-actions">
                <button class="k-btn sm" (click)="invoice(c)" title="Create invoice"><span class="material-icons">receipt_long</span></button>
                <button class="k-btn ghost sm" (click)="edit(c)"><span class="material-icons">edit</span></button>
                <button class="k-btn danger sm" (click)="remove(c)"><span class="material-icons">delete</span></button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .title { font-size: 28px; }
    .subtitle { color: var(--k-ink-muted); margin: 4px 0 24px; max-width: 640px; }
    .grid { display: grid; grid-template-columns: 380px 1fr; gap: 22px; align-items: start; }
    .form-card h2 { font-size: 18px; margin-bottom: 16px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .actions { display: flex; gap: 10px; }
    .err { color: var(--k-danger); font-size: 13px; margin-bottom: 10px; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .empty { color: var(--k-ink-muted); }
    .row { display: flex; align-items: center; gap: 16px; }
    .meta { flex: 1; min-width: 0; }
    .name { font-size: 16px; font-weight: 600; }
    .sub { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--k-ink-muted); margin: 4px 0; align-items: center; }
    .chip { background: rgba(255,255,255,.08); padding: 2px 8px; border-radius: 50px; }
    .deal { display: flex; gap: 16px; font-size: 13px; color: var(--k-ink-muted); }
    .deal strong { color: var(--k-ink); }
    .row-actions { display: flex; gap: 8px; }
    .row-actions .material-icons { font-size: 18px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminClientsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AdminApiService);
  private router = inject(Router);

  clients = signal<Client[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  editingId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    businessName: ['', Validators.required],
    category: [''],
    whatsapp: [''],
    phone: [''],
    email: [''],
    address: [''],
    setupCost: [0],
    monthlyCharge: [0],
    notes: ['']
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getClients().subscribe({
      next: (res: { success: boolean; data: Client[] }) => { this.clients.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const body = this.form.getRawValue();
    const id = this.editingId();
    const req = id ? this.api.updateClient(id, body) : this.api.createClient(body);
    req.subscribe({
      next: () => { this.saving.set(false); this.resetForm(); this.load(); },
      error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); }
    });
  }

  edit(c: Client): void {
    this.editingId.set(c._id);
    this.form.patchValue({
      businessName: c.businessName, category: c.category, whatsapp: c.whatsapp, phone: c.phone,
      email: c.email, address: c.address, setupCost: c.setupCost, monthlyCharge: c.monthlyCharge, notes: c.notes
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(c: Client): void {
    if (!confirm(`Delete client "${c.businessName}"?`)) return;
    this.api.deleteClient(c._id).subscribe({ next: () => this.load() });
  }

  invoice(c: Client): void {
    this.router.navigate(['/admin/invoices/new'], { queryParams: { client: c._id } });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ businessName: '', category: '', whatsapp: '', phone: '', email: '', address: '', setupCost: 0, monthlyCharge: 0, notes: '' });
  }
}
