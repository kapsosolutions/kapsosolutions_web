import { ChangeDetectionStrategy, Component, forwardRef, input, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PublicCategory } from '../../services/demo.service';

// Website (light-theme) category picker that shows each category's 1:1 logo
// next to its name. Implements ControlValueAccessor so it works with ngModel
// and required validation in the contact form.
@Component({
  selector: 'app-category-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CategorySelectComponent), multi: true }],
  template: `
    <button type="button" class="cs-trigger" [class.open]="open()" (click)="toggle()">
      @if (selected(); as sel) {
        @if (sel.imageUrl) {
          <img class="cs-img" [src]="sel.imageUrl" alt="" />
        } @else {
          <span class="cs-img placeholder-img"><span class="material-icons">category</span></span>
        }
        <span class="cs-label">{{ sel.name }}</span>
      } @else {
        <span class="cs-label muted">Select your business category</span>
      }
      <span class="material-icons chev">expand_more</span>
    </button>

    @if (open()) {
      <div class="cs-backdrop" (click)="close()"></div>
      <ul class="cs-panel" role="listbox">
        @if (categories().length === 0) {
          <li class="cs-empty">No categories available.</li>
        }
        @for (c of categories(); track c.slug || c.name) {
          <li class="cs-option" [class.active]="c.name === value()" role="option" (click)="pick(c)">
            @if (c.imageUrl) {
              <img class="cs-img" [src]="c.imageUrl" alt="" />
            } @else {
              <span class="cs-img placeholder-img"><span class="material-icons">category</span></span>
            }
            <span class="cs-label">{{ c.name }}</span>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    :host { display: block; position: relative; }
    .cs-trigger {
      width: 100%; display: flex; align-items: center; gap: 12px;
      background: #fff; color: #0a0a0a; border: 2px solid #e9ecef; border-radius: 10px;
      padding: 10px 14px; font-size: 1rem; font-family: inherit; cursor: pointer; text-align: left;
    }
    .cs-trigger.open, .cs-trigger:focus-visible {
      outline: none; border-color: #25D366; box-shadow: 0 0 0 4px rgba(37,211,102,.1);
    }
    .cs-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cs-label.muted { color: #9aa0a6; }
    .chev { color: #6c757d; transition: transform .2s ease; margin-left: auto; }
    .cs-trigger.open .chev { transform: rotate(180deg); }
    .cs-img {
      width: 34px; height: 34px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
      background: #f1f3f5; display: inline-flex; align-items: center; justify-content: center; color: #adb5bd;
    }
    .cs-img.placeholder-img .material-icons { font-size: 20px; }
    .cs-backdrop { position: fixed; inset: 0; z-index: 40; }
    .cs-panel {
      position: absolute; z-index: 41; top: calc(100% + 6px); left: 0; right: 0; margin: 0;
      background: #fff; border: 1px solid #e9ecef; border-radius: 12px; padding: 6px; list-style: none;
      max-height: 300px; overflow-y: auto; box-shadow: 0 16px 40px rgba(0,0,0,.14);
    }
    .cs-option { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 10px; cursor: pointer; }
    .cs-option:hover { background: #f6f9f7; }
    .cs-option.active { background: rgba(37,211,102,.12); }
    .cs-empty { padding: 14px; color: #9aa0a6; font-size: .95rem; }
  `]
})
export class CategorySelectComponent implements ControlValueAccessor {
  categories = input<PublicCategory[]>([]);

  value = signal<string>('');
  open = signal(false);

  selected = computed(() => this.categories().find((c) => c.name === this.value()) ?? null);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void { this.open.update((v) => !v); }
  close(): void { this.open.set(false); this.onTouched(); }

  pick(c: PublicCategory): void {
    this.value.set(c.name);
    this.onChange(c.name);
    this.onTouched();
    this.open.set(false);
  }

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
