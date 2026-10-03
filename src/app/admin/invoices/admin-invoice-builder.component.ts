import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, Client, Invoice, InvoiceItem } from '../admin-api.service';
import { KDropdownComponent, KOption } from '../ui/k-dropdown.component';

@Component({
  selector: 'app-admin-invoice-builder',
  imports: [FormsModule, DecimalPipe, RouterLink, KDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back" routerLink="/admin/invoices"><span class="material-icons">arrow_back</span> Invoices</a>
    <h1 class="title">New Invoice</h1>

    <div class="grid">
      <div class="k-card">
        <h2>Details</h2>
        <div class="two">
          <div class="k-field">
            <label class="k-label">Client</label>
            <k-dropdown [options]="clientOptions()" [(ngModel)]="clientId" (ngModelChange)="onClientChange($event)" placeholder="Select client"></k-dropdown>
          </div>
          <div class="k-field">
            <label class="k-label">Document type</label>
            <k-dropdown [options]="docTypeOptions" [(ngModel)]="docType"></k-dropdown>
          </div>
        </div>
        <div class="two">
          <div class="k-field"><label class="k-label">Invoice date</label><input class="k-input" type="text" [(ngModel)]="date" placeholder="e.g. 18 Jun 2026" /></div>
          <div class="k-field"><label class="k-label">Due date</label><input class="k-input" type="text" [(ngModel)]="dueDate" /></div>
        </div>
        <div class="k-field"><label class="k-label">Terms</label><input class="k-input" type="text" [(ngModel)]="terms" /></div>

        <h2 class="mt">Bill to</h2>
        <div class="k-field"><label class="k-label">Business name</label><input class="k-input" type="text" [(ngModel)]="billBusiness" /></div>
        <div class="two">
          <div class="k-field"><label class="k-label">WhatsApp</label><input class="k-input" type="tel" [(ngModel)]="billWhatsapp" /></div>
          <div class="k-field"><label class="k-label">Email</label><input class="k-input" type="email" [(ngModel)]="billEmail" /></div>
        </div>
        <div class="k-field"><label class="k-label">Address</label><input class="k-input" type="text" [(ngModel)]="billAddress" /></div>

        <h2 class="mt">Line items</h2>
        @for (it of items(); track $index) {
          <div class="item-row">
            <input class="k-input it-title" type="text" placeholder="Title" [(ngModel)]="it.title" />
            <input class="k-input it-hsn" type="text" placeholder="HSN" [(ngModel)]="it.hsn" />
            <input class="k-input it-amt" type="number" placeholder="Amount" [(ngModel)]="it.amount" (ngModelChange)="recalc()" />
            <button class="ic-del" (click)="removeItem($index)"><span class="material-icons">close</span></button>
          </div>
        }
        <button class="k-btn ghost sm add-item" (click)="addItem()"><span class="material-icons">add</span> Add line item</button>

        <h2 class="mt">Tax</h2>
        <div class="two">
          <div class="k-field">
            <label class="k-label">Tax type</label>
            <k-dropdown [options]="taxOptions" [(ngModel)]="taxType" (ngModelChange)="recalc()"></k-dropdown>
          </div>
          <div class="k-field"><label class="k-label">Rate (%)</label><input class="k-input" type="number" [(ngModel)]="taxRate" (ngModelChange)="recalc()" /></div>
        </div>

        @if (error()) { <p class="err">{{ error() }}</p> }
        <button class="k-btn" (click)="create()" [disabled]="saving() || !billBusiness.trim() || items().length === 0">
          {{ saving() ? 'Creating…' : 'Create invoice' }}
        </button>
      </div>

      <div class="k-card totals-card">
        <h2>Summary</h2>
        <div class="t-row"><span>Subtotal</span><span>₹{{ subtotal() | number: '1.2-2' }}</span></div>
        <div class="t-row"><span>{{ taxType === 'NONE' ? 'Tax' : taxType }} {{ taxType === 'NONE' ? '' : (taxRate + '%') }}</span><span>₹{{ taxAmount() | number: '1.2-2' }}</span></div>
        <div class="t-row grand"><span>Total</span><span>₹{{ total() | number: '1.2-2' }}</span></div>
        <p class="hint">After creating, you can generate the Razorpay QR + payment link and download the PDF.</p>
      </div>
    </div>
  `,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--k-ink-muted); font-size: 14px; margin-bottom: 12px; }
    .back:hover { color: var(--k-green); }
    .back .material-icons { font-size: 18px; }
    .title { font-size: 26px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
    h2 { font-size: 16px; margin-bottom: 14px; }
    h2.mt { margin-top: 24px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .item-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
    .it-title { flex: 1; }
    .it-hsn { width: 90px; }
    .it-amt { width: 110px; }
    .ic-del { background: none; border: none; color: var(--k-ink-muted); cursor: pointer; display: inline-flex; }
    .ic-del:hover { color: var(--k-danger); }
    .add-item { margin: 4px 0 0; }
    .add-item .material-icons { font-size: 16px; }
    .err { color: var(--k-danger); font-size: 13px; margin: 10px 0; }
    .k-btn:not(.ghost):not(.sm) { width: 100%; margin-top: 18px; }
    .totals-card { position: sticky; top: 16px; }
    .t-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--k-hairline); font-size: 14px; }
    .t-row.grand { font-size: 18px; font-weight: 700; border-bottom: none; }
    .hint { font-size: 12px; color: var(--k-ink-muted); margin-top: 14px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminInvoiceBuilderComponent implements OnInit {
  private api = inject(AdminApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clients = signal<Client[]>([]);
  clientOptions = computed<KOption[]>(() => [
    { value: '', label: '— No client (manual) —' },
    ...this.clients().map((c) => ({ value: c._id, label: c.businessName }))
  ]);
  docTypeOptions: KOption[] = ['INVOICE', 'ESTIMATION', 'TAX INVOICE', 'PROFORMA INVOICE', 'QUOTATION'].map((v) => ({ value: v, label: v }));
  taxOptions: KOption[] = [
    { value: 'IGST', label: 'IGST (Integrated)' },
    { value: 'CGST_SGST', label: 'CGST + SGST' },
    { value: 'NONE', label: 'No tax' }
  ];

  clientId = '';
  docType = 'INVOICE';
  date = this.today();
  dueDate = this.today();
  terms = 'Due on receipt';
  billBusiness = '';
  billWhatsapp = '';
  billEmail = '';
  billAddress = '';
  taxType = 'IGST';
  taxRate = 18;
  items = signal<InvoiceItem[]>([]);
  subtotal = signal(0);
  taxAmount = signal(0);
  total = signal(0);
  saving = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.api.getClients().subscribe({
      next: (res: { success: boolean; data: Client[] }) => {
        this.clients.set(res.data || []);
        const pre = this.route.snapshot.queryParamMap.get('client');
        if (pre) { this.clientId = pre; this.onClientChange(pre); }
      }
    });
    if (this.items().length === 0) this.addItem();
    this.recalc();
  }

  private today(): string {
    const d = new Date();
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
  }

  onClientChange(id: string): void {
    const c = this.clients().find((x) => x._id === id);
    if (!c) return;
    this.billBusiness = c.businessName;
    this.billWhatsapp = c.whatsapp;
    this.billEmail = c.email;
    this.billAddress = c.address;
    // Prefill line items from the client's deal.
    const items: InvoiceItem[] = [];
    if (c.setupCost > 0) items.push({ title: 'One time Onboarding & Setup Fees', details: 'Setup Cost', hsn: '998311', amount: c.setupCost });
    if (c.monthlyCharge > 0) items.push({ title: 'First Month Charges', details: 'Monthly Charges', hsn: '999599', amount: c.monthlyCharge });
    if (items.length) this.items.set(items);
    this.recalc();
  }

  addItem(): void { this.items.update((list) => [...list, { title: '', details: '', hsn: '', amount: 0 }]); }
  removeItem(i: number): void { this.items.update((list) => list.filter((_, idx) => idx !== i)); this.recalc(); }

  recalc(): void {
    const sub = this.items().reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const rate = this.taxType === 'NONE' ? 0 : Number(this.taxRate) || 0;
    const tax = +(sub * (rate / 100)).toFixed(2);
    this.subtotal.set(+sub.toFixed(2));
    this.taxAmount.set(tax);
    this.total.set(+(sub + tax).toFixed(2));
  }

  create(): void {
    this.saving.set(true);
    this.error.set('');
    const body: Partial<Invoice> = {
      docType: this.docType,
      client: this.clientId || undefined,
      billTo: { businessName: this.billBusiness.trim(), address: this.billAddress, whatsapp: this.billWhatsapp.replace(/\D/g, ''), email: this.billEmail },
      date: this.date, dueDate: this.dueDate, terms: this.terms,
      items: this.items(), taxType: this.taxType, taxRate: Number(this.taxRate) || 0,
      termsList: [
        'Subject to jurisdiction.',
        'All payments payable to Kapso Solutions.',
        '50% advance payment required before project kick-off.',
        'Advance payment is non-refundable once work commences.',
        'Validity of this estimation is 30 days from the date of issue.'
      ]
    };
    this.api.createInvoice(body).subscribe({
      next: (res: { success: boolean; data: Invoice }) => { this.saving.set(false); this.router.navigate(['/admin/invoices', res.data._id]); },
      error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e?.error?.message || 'Create failed'); }
    });
  }
}
