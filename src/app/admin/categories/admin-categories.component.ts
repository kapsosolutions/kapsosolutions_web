import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, Category } from '../admin-api.service';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="title">Categories</h1>
    <p class="subtitle">
      These appear as the category dropdown inside the Book Demo flow, each with its 1:1 logo.
    </p>

    <div class="grid">
      <!-- Add / edit form -->
      <div class="k-card form-card">
        <h2>{{ editingId() ? 'Edit category' : 'Add category' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="k-field">
            <label class="k-label" for="name">Category name</label>
            <input id="name" class="k-input" type="text" formControlName="name" placeholder="e.g. Restaurant" />
          </div>
          <div class="k-field">
            <label class="k-label" for="order">Display order</label>
            <input id="order" class="k-input" type="number" formControlName="order" />
          </div>
          <div class="k-field">
            <label class="k-label">Logo (1:1 square)</label>
            <div class="uploader">
              <div class="preview" [style.background-image]="previewBg()"></div>
              <label class="k-btn ghost sm file-btn">
                <span class="material-icons">upload</span> Choose image
                <input type="file" accept="image/*" (change)="onFile($event)" hidden />
              </label>
            </div>
            <p class="hint">Upload a square logo. It is cropped to 1:1 in the WhatsApp dropdown.</p>
          </div>

          @if (error()) { <p class="err">{{ error() }}</p> }

          <div class="actions">
            <button class="k-btn" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : (editingId() ? 'Update' : 'Add category') }}
            </button>
            @if (editingId()) {
              <button class="k-btn ghost" type="button" (click)="resetForm()">Cancel</button>
            }
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="list">
        @if (loading()) {
          <div class="k-card">Loading…</div>
        } @else if (categories().length === 0) {
          <div class="k-card empty">No categories yet. Add your first one.</div>
        } @else {
          @for (cat of categories(); track cat._id) {
            <div class="k-card row">
              <div class="logo" [style.background-image]="cat.imageUrl ? 'url(' + cat.imageUrl + ')' : ''">
                @if (!cat.imageUrl) { <span class="material-icons">image</span> }
              </div>
              <div class="meta">
                <div class="name">{{ cat.name }}</div>
                <div class="slug">order {{ cat.order }} · {{ cat.slug }}</div>
              </div>
              <div class="row-actions">
                <button class="k-btn ghost sm" (click)="edit(cat)"><span class="material-icons">edit</span></button>
                <button class="k-btn danger sm" (click)="remove(cat)"><span class="material-icons">delete</span></button>
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
    .grid { display: grid; grid-template-columns: 360px 1fr; gap: 22px; align-items: start; }
    .form-card h2 { font-size: 18px; margin-bottom: 16px; }
    .uploader { display: flex; align-items: center; gap: 14px; }
    .preview { width: 72px; height: 72px; border-radius: 16px; background: #1f2228 center/cover no-repeat; border: 1px solid var(--k-hairline); }
    .file-btn { cursor: pointer; }
    .hint { font-size: 12px; color: var(--k-ink-muted); margin-top: 8px; }
    .actions { display: flex; gap: 10px; }
    .err { color: var(--k-danger); font-size: 13px; margin-bottom: 10px; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .empty { color: var(--k-ink-muted); }
    .row { display: flex; align-items: center; gap: 16px; padding: 14px 18px; }
    .logo { width: 52px; height: 52px; border-radius: 50%; background: #1f2228 center/cover no-repeat; display:flex; align-items:center; justify-content:center; color: var(--k-ink-muted); flex-shrink: 0; }
    .meta { flex: 1; min-width: 0; }
    .name { font-size: 16px; }
    .slug { font-size: 12px; color: var(--k-ink-muted); }
    .row-actions { display: flex; gap: 8px; }
    .row-actions .material-icons { font-size: 18px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AdminApiService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  editingId = signal<string | null>(null);
  private file: File | null = null;
  private previewUrl = signal('');

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    order: [0]
  });

  previewBg(): string {
    return this.previewUrl() ? `url(${this.previewUrl()})` : '';
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: (res: { success: boolean; data: Category[] }) => { this.categories.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file = f;
    if (f) this.previewUrl.set(URL.createObjectURL(f));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const { name, order } = this.form.getRawValue();
    const fd = new FormData();
    fd.append('name', name);
    fd.append('order', String(order));
    if (this.file) fd.append('image', this.file);

    const id = this.editingId();
    const req = id ? this.api.updateCategory(id, fd) : this.api.createCategory(fd);
    req.subscribe({
      next: () => { this.saving.set(false); this.resetForm(); this.load(); },
      error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); }
    });
  }

  edit(cat: Category): void {
    this.editingId.set(cat._id);
    this.form.patchValue({ name: cat.name, order: cat.order });
    this.previewUrl.set(cat.imageUrl || '');
    this.file = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(cat: Category): void {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.api.deleteCategory(cat._id).subscribe({ next: () => this.load() });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.file = null;
    this.previewUrl.set('');
    this.form.reset({ name: '', order: 0 });
  }
}
