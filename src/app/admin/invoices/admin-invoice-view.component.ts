import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, Invoice } from '../admin-api.service';

declare const html2pdf: unknown;

@Component({
  selector: 'app-admin-invoice-view',
  imports: [DatePipe, DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back" routerLink="/admin/invoices"><span class="material-icons">arrow_back</span> Invoices</a>

    @if (loading()) {
      <div class="k-card">Loading…</div>
    } @else if (!inv()) {
      <div class="k-card empty">Invoice not found.</div>
    } @else {
      <!-- Action bar -->
      <div class="actionbar">
        <div class="status">
          <span class="k-chip" [class.green]="inv()!.status === 'Paid'" [class.amber]="inv()!.status !== 'Paid'">{{ inv()!.status }}</span>
          @if (inv()!.status === 'Paid' && inv()!.paidAt) { <span class="muted">Paid {{ inv()!.paidAt | date: 'dd MMM yyyy, HH:mm' }}</span> }
        </div>
        <div class="btns">
          @if (inv()!.status !== 'Paid') {
            <button class="k-btn" (click)="generate()" [disabled]="generating()">
              <span class="material-icons">qr_code_2</span> {{ generating() ? 'Generating…' : (inv()!.rzpQrImageUrl || inv()!.rzpPaymentLinkUrl ? 'Regenerate payment' : 'Generate Razorpay payment') }}
            </button>
            <button class="k-btn ghost" (click)="refresh()" title="Refresh status"><span class="material-icons">refresh</span></button>
          }
          <button class="k-btn ghost" (click)="downloadPdf()" [disabled]="pdfBusy()">
            <span class="material-icons">download</span> {{ pdfBusy() ? 'Preparing…' : 'Download PDF' }}
          </button>
        </div>
      </div>

      @if (genError()) { <p class="err">{{ genError() }}</p> }

      @if (inv()!.rzpPaymentLinkUrl && inv()!.status !== 'Paid') {
        <div class="k-card link-card">
          <span class="material-icons">link</span>
          <input class="k-input" readonly [value]="inv()!.rzpPaymentLinkUrl" #linkInput />
          <button class="k-btn sm" (click)="copyLink(linkInput)">{{ copied() ? 'Copied' : 'Copy' }}</button>
          <a class="k-btn ghost sm" [href]="inv()!.rzpPaymentLinkUrl" target="_blank" rel="noopener">Open</a>
        </div>
      }

      <!-- A4 invoice document (white paper) -->
      <div class="paper-wrap">
        <article class="paper" id="invoiceDoc">
          @if (inv()!.status === 'Paid') { <div class="paid-stamp">PAID</div> }

          <header class="ph">
            <div class="ph-left">
              <img class="logo" [src]="logoUrl" alt="Kapso Solutions" crossorigin="anonymous" />
            </div>
            <div class="ph-right">
              <div class="company">KAPSO SOLUTIONS</div>
              <div class="contact">+91 7989909361 &nbsp;|&nbsp; contact.kapsosolutions&#64;gmail.com &nbsp;|&nbsp; kapsosolutions.com</div>
            </div>
          </header>

          <div class="title-sec">
            <span class="title-line"></span>
            <h1>{{ inv()!.status === 'Paid' ? 'PAYMENT RECEIPT' : inv()!.docType }}</h1>
          </div>

          <div class="meta-grid">
            <div class="bill-to">
              <div class="lbl">{{ inv()!.status === 'Paid' ? 'RECEIVED FROM:' : (inv()!.docType + ' TO:') }}</div>
              <div class="bt-name">{{ inv()!.billTo?.businessName }}</div>
              <div class="bt-addr">{{ inv()!.billTo?.address }}</div>
              @if (inv()!.billTo?.whatsapp) { <div class="bt-addr">+{{ inv()!.billTo?.whatsapp }}</div> }
            </div>
            <div class="meta-table">
              <div class="mt-l">Invoice No:</div><div class="mt-v">{{ inv()!.invoiceNo }}</div>
              <div class="mt-l">Date:</div><div class="mt-v">{{ inv()!.date }}</div>
              <div class="mt-l">Terms:</div><div class="mt-v">{{ inv()!.terms }}</div>
              <div class="mt-l">Due Date:</div><div class="mt-v">{{ inv()!.dueDate }}</div>
              @if (inv()!.rzpPaymentId) { <div class="mt-l">Payment ID:</div><div class="mt-v">{{ inv()!.rzpPaymentId }}</div> }
            </div>
          </div>

          <table class="items">
            <thead><tr><th class="c-n">#</th><th class="c-d">Description</th><th class="c-h">HSN</th><th class="c-a">Amount</th></tr></thead>
            <tbody>
              @for (it of inv()!.items; track $index) {
                <tr>
                  <td>{{ $index + 1 }}</td>
                  <td><div class="it-title">{{ it.title }}</div>@if (it.details) { <div class="it-det">{{ it.details }}</div> }</td>
                  <td>{{ it.hsn }}</td>
                  <td class="ta-r">₹{{ it.amount | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="summary">
            <div class="qr-box">
              @if (inv()!.status === 'Paid') {
                <div class="paid-note"><span class="material-icons">check_circle</span> Payment received. Thank you!</div>
              } @else if (inv()!.rzpQrImageUrl) {
                <img class="qr" [src]="inv()!.rzpQrImageUrl" alt="Scan to pay" crossorigin="anonymous" />
                <div class="scan">SCAN &amp; PAY (UPI)</div>
              } @else {
                <div class="qr-empty">Generate Razorpay payment to show a scan-to-pay QR here.</div>
              }
            </div>
            <div class="totals">
              <div class="tr"><span>Subtotal</span><span>₹{{ inv()!.subtotal | number: '1.2-2' }}</span></div>
              @if (inv()!.taxType !== 'NONE') {
                <div class="tr"><span>{{ inv()!.taxType }} {{ inv()!.taxRate }}%</span><span>₹{{ inv()!.taxAmount | number: '1.2-2' }}</span></div>
              }
              <div class="tr grand"><span>Total</span><span>₹{{ inv()!.total | number: '1.2-2' }}</span></div>
            </div>
          </div>

          @if (inv()!.termsList?.length) {
            <div class="terms">
              <div class="terms-h">Terms &amp; Conditions:</div>
              <ul>@for (t of inv()!.termsList; track $index) { <li>{{ t }}</li> }</ul>
            </div>
          }
          <footer class="pf">This is a computer generated {{ inv()!.status === 'Paid' ? 'receipt' : 'invoice' }}. No signature required.</footer>
        </article>
      </div>
    }
  `,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--k-ink-muted); font-size: 14px; margin-bottom: 12px; }
    .back:hover { color: var(--k-green); }
    .back .material-icons { font-size: 18px; }
    .empty { color: var(--k-ink-muted); }
    .actionbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
    .status { display: flex; align-items: center; gap: 10px; }
    .muted { color: var(--k-ink-muted); font-size: 13px; }
    .btns { display: flex; gap: 10px; flex-wrap: wrap; }
    .btns .material-icons { font-size: 17px; }
    .err { color: var(--k-danger); font-size: 13px; margin-bottom: 12px; }
    .link-card { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .link-card .material-icons { color: var(--k-green); }
    .link-card .k-input { flex: 1; }

    .paper-wrap { display: flex; justify-content: center; }
    .paper { width: 794px; max-width: 100%; background: #fff; color: #1a1a1a; padding: 44px 48px; border-radius: 8px; position: relative; font-family: 'Inter', 'Outfit', sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
    .paid-stamp { position: absolute; top: 150px; right: 60px; font-size: 72px; font-weight: 800; color: rgba(0,200,90,.18); border: 6px solid rgba(0,200,90,.18); padding: 6px 24px; border-radius: 12px; transform: rotate(-14deg); letter-spacing: 4px; pointer-events: none; }
    .ph { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
    .logo { height: 54px; width: auto; object-fit: contain; }
    .ph-right { text-align: right; }
    .company { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
    .contact { font-size: 11px; color: #555; margin-top: 4px; }
    .title-sec { display: flex; align-items: center; gap: 14px; margin: 26px 0 20px; }
    .title-line { flex: 1; height: 3px; background: linear-gradient(90deg, #00c85a, #00c85a); border-radius: 2px; }
    .title-sec h1 { font-size: 26px; font-weight: 800; color: #00a84b; letter-spacing: 2px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 22px; }
    .lbl { font-size: 11px; font-weight: 700; color: #00a84b; letter-spacing: .5px; margin-bottom: 6px; }
    .bt-name { font-size: 16px; font-weight: 700; }
    .bt-addr { font-size: 13px; color: #555; }
    .meta-table { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; align-self: start; }
    .mt-l { font-size: 12px; color: #777; text-align: right; }
    .mt-v { font-size: 12px; font-weight: 600; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.items th { background: #0a0a0a; color: #fff; font-size: 11px; text-align: left; padding: 10px 12px; }
    table.items th.c-a, td.ta-r { text-align: right; }
    table.items td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: top; }
    .it-title { font-weight: 600; }
    .it-det { font-size: 11px; color: #888; }
    .summary { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
    .qr-box { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .qr { width: 150px; height: 150px; object-fit: contain; border: 1px solid #eee; border-radius: 8px; padding: 4px; background: #fff; }
    .scan { font-size: 11px; font-weight: 700; color: #00a84b; letter-spacing: 1px; }
    .qr-empty { width: 150px; font-size: 11px; color: #aaa; text-align: center; }
    .paid-note { display: flex; align-items: center; gap: 8px; color: #00a84b; font-weight: 700; font-size: 15px; }
    .totals { min-width: 240px; }
    .tr { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; }
    .tr.grand { font-size: 18px; font-weight: 800; border-bottom: none; border-top: 2px solid #0a0a0a; margin-top: 4px; padding-top: 10px; }
    .terms { margin-bottom: 18px; }
    .terms-h { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
    .terms ul { margin: 0; padding-left: 18px; }
    .terms li { font-size: 11px; color: #666; margin-bottom: 3px; }
    .pf { text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
    @media (max-width: 840px) { .paper { padding: 24px; } .paid-stamp { right: 20px; font-size: 48px; } }
  `]
})
export class AdminInvoiceViewComponent implements OnInit {
  private api = inject(AdminApiService);
  private route = inject(ActivatedRoute);

  inv = signal<Invoice | null>(null);
  loading = signal(true);
  generating = signal(false);
  genError = signal('');
  pdfBusy = signal(false);
  copied = signal(false);
  logoUrl = 'https://www.kapsosolutions.com/logo.png';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
    else this.loading.set(false);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.api.getInvoice(id).subscribe({
      next: (res: { success: boolean; data: Invoice }) => { this.inv.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  refresh(): void { const i = this.inv(); if (i) this.load(i._id); }

  generate(): void {
    const i = this.inv();
    if (!i) return;
    this.generating.set(true);
    this.genError.set('');
    this.api.generateRazorpay(i._id).subscribe({
      next: (res: { success: boolean; data: Invoice; results: unknown }) => {
        this.generating.set(false);
        this.inv.set(res.data);
        const r = res.results as { qrError?: string; linkError?: string };
        if (r?.qrError && r?.linkError) this.genError.set(`QR: ${r.qrError} · Link: ${r.linkError}`);
        else if (r?.qrError) this.genError.set(`QR unavailable (${r.qrError}). Payment link is ready.`);
      },
      error: (e: HttpErrorResponse) => { this.generating.set(false); this.genError.set(e?.error?.message || 'Generation failed'); }
    });
  }

  copyLink(input: HTMLInputElement): void {
    input.select();
    navigator.clipboard?.writeText(input.value).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }

  async downloadPdf(): Promise<void> {
    const el = document.getElementById('invoiceDoc');
    if (!el) return;
    this.pdfBusy.set(true);
    try {
      await this.ensureHtml2Pdf();
      const inv = this.inv();
      const name = `${inv?.status === 'Paid' ? 'receipt' : 'invoice'}-${inv?.invoiceNo || 'document'}.pdf`;
      // @ts-expect-error html2pdf is loaded globally from CDN
      await html2pdf().set({
        margin: 0,
        filename: name,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      }).from(el).save();
    } catch {
      this.genError.set('Could not generate PDF.');
    } finally {
      this.pdfBusy.set(false);
    }
  }

  private ensureHtml2Pdf(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof html2pdf !== 'undefined') return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.3/html2pdf.bundle.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('load failed'));
      document.head.appendChild(s);
    });
  }
}
