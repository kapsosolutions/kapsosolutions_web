import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, FlowSetting } from '../admin-api.service';

@Component({
  selector: 'app-admin-flow-images',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="title">Flow Images &amp; Messages</h1>
    <p class="subtitle">
      Header images and message copy sent on WhatsApp: the welcome message, the Book Demo button,
      the "demo booked" confirmation, and the "already requested" notice.
    </p>

    @if (loading()) {
      <div class="k-card">Loading…</div>
    } @else {
      <div class="settings">
        @for (s of settings(); track s.key) {
          <div class="k-card setting">
            <div class="head">
              <span class="material-icons">{{ s.type === 'image' ? 'image' : 'notes' }}</span>
              <div class="lbl">{{ s.label }}</div>
              @if (savedKey() === s.key) { <span class="k-chip green">Saved</span> }
            </div>

            @if (s.type === 'image') {
              <div class="img-row">
                <div class="thumb" [style.background-image]="s.value ? 'url(' + s.value + ')' : ''">
                  @if (!s.value) { <span class="material-icons">add_photo_alternate</span> }
                </div>
                <div class="img-actions">
                  <label class="k-btn ghost sm file-btn">
                    <span class="material-icons">upload</span> Upload image
                    <input type="file" accept="image/*" (change)="onImage($event, s.key)" hidden />
                  </label>
                  <p class="hint">Header banner shown above the message body on WhatsApp.</p>
                </div>
              </div>
            } @else {
              <textarea class="k-textarea" rows="4" [(ngModel)]="drafts[s.key]"></textarea>
              <button class="k-btn sm" (click)="saveText(s.key)" [disabled]="savingKey() === s.key">
                {{ savingKey() === s.key ? 'Saving…' : 'Save text' }}
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .title { font-size: 28px; }
    .subtitle { color: var(--k-ink-muted); margin: 4px 0 24px; max-width: 720px; }
    .settings { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
    .setting .head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .setting .head .material-icons { color: var(--k-green); }
    .setting .lbl { font-size: 15px; flex: 1; }
    .img-row { display: flex; gap: 16px; align-items: center; }
    .thumb { width: 96px; height: 96px; border-radius: 16px; background: #1f2228 center/cover no-repeat; border: 1px solid var(--k-hairline); display:flex; align-items:center; justify-content:center; color: var(--k-ink-muted); flex-shrink: 0; }
    .file-btn { cursor: pointer; }
    .hint { font-size: 12px; color: var(--k-ink-muted); margin-top: 8px; }
    textarea { margin-bottom: 12px; }
  `]
})
export class AdminFlowImagesComponent implements OnInit {
  private api = inject(AdminApiService);

  settings = signal<FlowSetting[]>([]);
  loading = signal(true);
  savingKey = signal<string | null>(null);
  savedKey = signal<string | null>(null);
  drafts: Record<string, string> = {};

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getSettings().subscribe({
      next: (res: { success: boolean; data: FlowSetting[] }) => {
        const data = res.data || [];
        this.settings.set(data);
        data.forEach((s) => { if (s.type === 'text') this.drafts[s.key] = s.value; });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onImage(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    this.savingKey.set(key);
    this.api.updateSetting(key, fd).subscribe({
      next: () => { this.savingKey.set(null); this.flashSaved(key); this.load(); },
      error: () => this.savingKey.set(null)
    });
  }

  saveText(key: string): void {
    const fd = new FormData();
    fd.append('value', this.drafts[key] ?? '');
    this.savingKey.set(key);
    this.api.updateSetting(key, fd).subscribe({
      next: () => { this.savingKey.set(null); this.flashSaved(key); },
      error: () => this.savingKey.set(null)
    });
  }

  private flashSaved(key: string): void {
    this.savedKey.set(key);
    setTimeout(() => this.savedKey.set(null), 2000);
  }
}
