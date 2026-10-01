import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService } from '../admin-api.service';
import { KDropdownComponent, KOption } from '../ui/k-dropdown.component';

type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
interface TemplateButton { type: ButtonType; text: string; url?: string; phone?: string; }

// Shared "create WhatsApp template" form + live preview. Emits (created) on success.
@Component({
  selector: 'app-template-create',
  imports: [ReactiveFormsModule, FormsModule, KDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="create()">
      <div class="k-field">
        <label class="k-label">Name (lowercase, no spaces)</label>
        <input class="k-input" type="text" formControlName="name" placeholder="demo_followup" />
      </div>
      <div class="two">
        <div class="k-field">
          <label class="k-label">Category</label>
          <k-dropdown [options]="categoryOptions" formControlName="category"></k-dropdown>
        </div>
        <div class="k-field">
          <label class="k-label">Language</label>
          <k-dropdown [options]="languageOptions" formControlName="language"></k-dropdown>
        </div>
      </div>

      <div class="k-field">
        <label class="k-label">Header (optional)</label>
        <k-dropdown [options]="headerTypeOptions" formControlName="headerType"></k-dropdown>
      </div>
      @if (form.controls.headerType.value === 'text') {
        <div class="k-field">
          <label class="k-label">Header text</label>
          <input class="k-input" type="text" formControlName="headerText" />
        </div>
      }
      @if (form.controls.headerType.value === 'image' || form.controls.headerType.value === 'video') {
        <div class="k-field">
          <label class="k-label">{{ form.controls.headerType.value === 'image' ? 'Header image' : 'Header video' }}</label>
          <div class="uploader">
            <label class="k-btn ghost sm file-btn">
              <span class="material-icons">upload</span> Choose {{ form.controls.headerType.value }}
              <input type="file" [accept]="form.controls.headerType.value === 'image' ? 'image/*' : 'video/*'" (change)="onMedia($event)" hidden />
            </label>
            @if (mediaName()) { <span class="file-name">{{ mediaName() }}</span> }
          </div>
        </div>
      }

      <div class="k-field">
        <label class="k-label">Body</label>
        <textarea class="k-textarea" rows="4" formControlName="bodyText"></textarea>
      </div>
      <div class="k-field">
        <label class="k-label">Footer (optional)</label>
        <input class="k-input" type="text" formControlName="footerText" />
      </div>

      <div class="k-field">
        <label class="k-label">Buttons (optional)</label>
        <div class="btn-adds">
          <button type="button" class="k-btn ghost sm" (click)="addButton('QUICK_REPLY')"><span class="material-icons">reply</span> Reply</button>
          <button type="button" class="k-btn ghost sm" (click)="addButton('URL')"><span class="material-icons">open_in_new</span> URL</button>
          <button type="button" class="k-btn ghost sm" (click)="addButton('PHONE_NUMBER')"><span class="material-icons">call</span> Call</button>
        </div>
        @for (b of buttons; track $index) {
          <div class="btn-row">
            <span class="btn-kind">{{ kindLabel(b.type) }}</span>
            <input class="k-input" placeholder="Button text" [(ngModel)]="b.text" [ngModelOptions]="{ standalone: true }" maxlength="25" />
            @if (b.type === 'URL') { <input class="k-input" placeholder="https://example.com" [(ngModel)]="b.url" [ngModelOptions]="{ standalone: true }" /> }
            @if (b.type === 'PHONE_NUMBER') { <input class="k-input" placeholder="+91 98765 43210" [(ngModel)]="b.phone" [ngModelOptions]="{ standalone: true }" /> }
            <button type="button" class="ic-del" (click)="removeButton($index)"><span class="material-icons">close</span></button>
          </div>
        }
      </div>

      <!-- Live preview -->
      <div class="k-field">
        <label class="k-label">Preview</label>
        <div class="pv-chat">
          <div class="pv-bubble">
            @if (form.controls.headerType.value === 'image') {
              @if (imagePreviewUrl()) { <img class="pv-media-img" [src]="imagePreviewUrl()" alt="" /> }
              @else { <div class="pv-media"><span class="material-icons">image</span></div> }
            } @else if (form.controls.headerType.value === 'video') {
              <div class="pv-media"><span class="material-icons">videocam</span></div>
            } @else if (form.controls.headerType.value === 'text' && form.controls.headerText.value) {
              <div class="pv-header">{{ form.controls.headerText.value }}</div>
            }
            <div class="pv-body">{{ form.controls.bodyText.value || 'Your message body will appear here…' }}</div>
            @if (form.controls.footerText.value) { <div class="pv-footer">{{ form.controls.footerText.value }}</div> }
            <div class="pv-time">now</div>
          </div>
          @if (buttons.length) {
            <div class="pv-buttons">
              @for (b of buttons; track $index) {
                <div class="pv-btn"><span class="material-icons">{{ btnIcon(b.type) }}</span> {{ b.text || 'Button' }}</div>
              }
            </div>
          }
        </div>
      </div>

      @if (error()) { <p class="err">{{ error() }}</p> }
      @if (ok()) { <p class="ok">Template submitted for approval.</p> }

      <button class="k-btn submit" type="submit" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Submitting…' : 'Create template' }}
      </button>
    </form>
  `,
  styles: [`
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .uploader { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .file-btn { cursor: pointer; }
    .file-name { font-size: 13px; color: var(--k-ink-muted); word-break: break-all; }
    .btn-adds { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .btn-adds .material-icons { font-size: 15px; }
    .btn-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .btn-kind { font-size: 11px; color: var(--k-ink-muted); width: 42px; flex-shrink: 0; text-transform: uppercase; }
    .btn-row .k-input { padding: 8px 10px; font-size: 13px; }
    .ic-del { flex-shrink: 0; background: none; border: none; color: var(--k-ink-muted); cursor: pointer; display: inline-flex; }
    .ic-del:hover { color: var(--k-danger); }
    .submit { width: 100%; margin-top: 6px; }
    .err { color: var(--k-danger); font-size: 13px; margin-bottom: 10px; }
    .ok { color: #4ade80; font-size: 13px; margin-bottom: 10px; }
    .pv-chat { background: #0b141a; border-radius: 12px; padding: 14px; }
    .pv-bubble { background: #202c33; border-radius: 10px; padding: 8px 10px; box-shadow: 0 1px 1px rgba(0,0,0,.2); color: #e9edef; }
    .pv-header { font-weight: 700; margin-bottom: 6px; white-space: pre-wrap; }
    .pv-media { height: 130px; border-radius: 8px; background: #2a3942; display: flex; align-items: center; justify-content: center; color: #8696a0; margin-bottom: 6px; }
    .pv-media .material-icons { font-size: 42px; }
    .pv-media-img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 6px; display: block; }
    .pv-body { font-size: 14px; white-space: pre-wrap; word-break: break-word; color: #e9edef; }
    .pv-footer { font-size: 12px; color: #8696a0; margin-top: 6px; }
    .pv-time { font-size: 10px; color: #8696a0; text-align: right; margin-top: 4px; }
    .pv-buttons { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
    .pv-btn { background: #202c33; border-radius: 8px; padding: 9px; text-align: center; color: #53bdeb; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 1px 1px rgba(0,0,0,.2); }
    .pv-btn .material-icons { font-size: 16px; }
  `]
})
export class TemplateCreateComponent {
  private fb = inject(FormBuilder);
  private api = inject(AdminApiService);

  created = output<void>();

  saving = signal(false);
  error = signal('');
  ok = signal(false);
  mediaName = signal('');
  imagePreviewUrl = signal('');
  mediaFile: File | null = null;
  buttons: TemplateButton[] = [];

  categoryOptions: KOption[] = [
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utility' }
  ];
  languageOptions: KOption[] = [
    { value: 'en_US', label: 'English (US)' },
    { value: 'en', label: 'English' }
  ];
  headerTypeOptions: KOption[] = [
    { value: 'none', label: 'None' },
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image / Photo' },
    { value: 'video', label: 'Video' }
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
    category: ['MARKETING', Validators.required],
    language: ['en_US', Validators.required],
    headerType: ['none', Validators.required],
    headerText: [''],
    bodyText: ['', Validators.required],
    footerText: ['']
  });

  onMedia(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.mediaFile = f;
    this.mediaName.set(f?.name ?? '');
    this.imagePreviewUrl.set(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
  }

  addButton(type: ButtonType): void { this.buttons = [...this.buttons, { type, text: '', url: '', phone: '' }]; }
  removeButton(i: number): void { this.buttons = this.buttons.filter((_, idx) => idx !== i); }
  kindLabel(t: ButtonType): string { return t === 'URL' ? 'URL' : t === 'PHONE_NUMBER' ? 'Call' : 'Reply'; }
  btnIcon(t: ButtonType): string { return t === 'URL' ? 'open_in_new' : t === 'PHONE_NUMBER' ? 'call' : 'reply'; }

  create(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if ((v.headerType === 'image' || v.headerType === 'video') && !this.mediaFile) {
      this.error.set(`Please choose a ${v.headerType} file for the header.`);
      return;
    }
    const cleanButtons = this.buttons.filter((b) => b.text.trim());
    if (cleanButtons.some((b) => b.type === 'URL' && !b.url?.trim())) { this.error.set('Add a URL for the CTA button.'); return; }
    if (cleanButtons.some((b) => b.type === 'PHONE_NUMBER' && !b.phone?.trim())) { this.error.set('Add a phone number for the call button.'); return; }

    this.saving.set(true);
    this.error.set('');
    this.ok.set(false);

    const fd = new FormData();
    fd.append('name', v.name);
    fd.append('category', v.category);
    fd.append('language', v.language);
    fd.append('headerType', v.headerType);
    if (v.headerType === 'text') fd.append('headerText', v.headerText || '');
    fd.append('bodyText', v.bodyText);
    fd.append('footerText', v.footerText || '');
    if ((v.headerType === 'image' || v.headerType === 'video') && this.mediaFile) fd.append('headerMedia', this.mediaFile);
    if (cleanButtons.length) fd.append('buttons', JSON.stringify(cleanButtons));

    this.api.createTemplate(fd).subscribe({
      next: () => {
        this.saving.set(false);
        this.ok.set(true);
        this.mediaFile = null;
        this.mediaName.set('');
        this.imagePreviewUrl.set('');
        this.buttons = [];
        this.form.reset({ category: 'MARKETING', language: 'en_US', headerType: 'none' });
        this.created.emit();
      },
      error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e?.error?.message || 'Create failed'); }
    });
  }
}
