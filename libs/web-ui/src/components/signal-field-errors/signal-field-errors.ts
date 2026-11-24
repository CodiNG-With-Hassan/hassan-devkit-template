import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  FIELD_ERRORS_TRANSLATION_PREFIX,
  FieldErrorEntry,
  mapFieldErrorToTranslationKey,
} from 'shared-utils';
// Minimal structural view of a signal-forms FieldTree. Typed structurally on
// purpose: FieldTree's value signal is invariant in its value type, so a
// FieldTree<TValue> input would reject every concrete field the caller has.
export type FieldErrorsSource = () => {
  readonly touched: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly errors: Signal<readonly { readonly kind: string }[]>;
};

/**
 * Renders the translated validation messages of a signal-forms field once it
 * has been touched or edited. Announced politely to assistive technology.
 *
 * Uses the framework-agnostic error mapping exported from `shared-utils`.
 *
 * Usage: `<app-signal-field-errors [label]="…" [field]="form.firstName" />`
 */
@Component({
  selector: 'app-signal-field-errors',
  imports: [TranslatePipe],
  templateUrl: './signal-field-errors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-4', 'aria-live': 'polite' },
})
export class SignalFieldErrors {
  readonly label = input.required<string>();
  readonly field = input.required<FieldErrorsSource>();

  protected readonly translationsPath = FIELD_ERRORS_TRANSLATION_PREFIX;

  protected readonly errors = computed<FieldErrorEntry[]>(() => {
    const state = this.field()();
    if (!state.invalid() || (!state.dirty() && !state.touched())) return [];

    const label = this.label();
    return state.errors().map((error) => mapFieldErrorToTranslationKey(error, label));
  });
}
