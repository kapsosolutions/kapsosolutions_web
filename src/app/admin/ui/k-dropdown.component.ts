import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface KOption {
  value: string;
  label: string;
}

// Themed dropdown that replaces native <select> (whose option list can't be
// styled to match the dark theme). Implements ControlValueAccessor so it works
// with ngModel / ngModelChange and formControlName.
@Component({
  selector: 'k-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KDropdownComponent), multi: true }],
  template: `
    <button type="button" class="dd-trigger" [class.open]="open()" [disabled]="disabled()" (click)="toggle()">
      <span class="dd-value" [class.placeholder]="!selected()">{{ selectedLabel() }}</span>
      <span class="material-icons">expand_more</span>
    </button>
    @if (open()) {
      <div class="dd-backdrop" (click)="close()"></div>
      <ul class="dd-panel" role="listbox">
        @for (o of options(); track o.value) {
          <li class="dd-option" [class.active]="o.value === value()" role="option" (click)="pick(o)">
            {{ o.label }}
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    :host { display: block; position: relative; }
    .dd-trigger {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
      background: var(--k-surface-2, #1f2228); color: var(--k-ink, #f1f3f5);
      border: 1px solid var(--k-hairline, #2a2d33); border-radius: 12px;
      padding: 12px 14px; font-size: 15px; cursor: pointer; font-family: inherit; text-align: left;
    }
    .dd-trigger:disabled { opacity: .5; cursor: not-allowed; }
    .dd-trigger.open, .dd-trigger:focus-visible {
      border-color: var(--k-green, #25d366); box-shadow: 0 0 0 3px rgba(37,211,102,.18); outline: none;
    }
    .dd-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dd-value.placeholder { color: #6b7280; }
    .dd-trigger .material-icons { font-size: 20px; color: var(--k-ink-muted, #9ca3af); transition: transform .15s ease; }
    .dd-trigger.open .material-icons { transform: rotate(180deg); }
    .dd-backdrop { position: fixed; inset: 0; z-index: 50; }
    .dd-panel {
      position: absolute; z-index: 51; top: calc(100% + 6px); left: 0; right: 0; margin: 0;
      background: var(--k-surface, #16181c); border: 1px solid var(--k-hairline, #2a2d33);
      border-radius: 12px; padding: 6px; list-style: none; max-height: 260px; overflow-y: auto;
      box-shadow: 0 12px 32px rgba(0,0,0,.45);
    }
    .dd-option { padding: 10px 12px; border-radius: 8px; font-size: 14px; cursor: pointer; color: var(--k-ink, #f1f3f5); }
    .dd-option:hover { background: rgba(127,127,127,.14); }
    .dd-option.active { background: rgba(37,211,102,.16); color: #4ade80; }
  `]
})
export class KDropdownComponent implements ControlValueAccessor {
  options = input<KOption[]>([]);
  placeholder = input('Select');

  value = signal<string>('');
  open = signal(false);
  disabled = signal(false);

  selected = computed(() => this.options().some((o) => o.value === this.value()));
  selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? this.placeholder());

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
  }
  close(): void { this.open.set(false); this.onTouched(); }

  pick(o: KOption): void {
    this.value.set(o.value);
    this.onChange(o.value);
    this.onTouched();
    this.open.set(false);
  }

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
