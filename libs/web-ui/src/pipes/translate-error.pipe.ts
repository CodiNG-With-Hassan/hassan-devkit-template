import {
  inject,
  Injector,
  OnDestroy,
  Pipe,
  PipeTransform,
  runInInjectionContext,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { ErrorTranslation } from 'tpl-i18n';

/**
 * Renders an ErrorTranslation (ADR 0002) in one go: `{{ error | translateError }}`
 * instead of `{{ error.key | translate: error.params }}`, so call sites cannot
 * forget the params and leak raw `{{param}}` placeholders — a plain string key
 * is rejected at compile time.
 *
 * Delegates to ngx-translate's impure TranslatePipe (constructed in this pipe's
 * injection context, so it picks up TranslateService and the host view's
 * ChangeDetectorRef) — live language switching and the async errors-catalog
 * load keep re-rendering for free. Delegation instead of inheritance because an
 * override cannot narrow TranslatePipe's `string` query to ErrorTranslation.
 *
 * `paramKeys` (placeholders whose value is itself a catalog key, e.g. the
 * status labels in an invalid-transition error) go through one nested
 * TranslatePipe each, so every label re-renders with the sentence instead of
 * staying in the language it was resolved in.
 */
@Pipe({ name: 'translateError', pure: false })
export class TranslateErrorPipe implements PipeTransform, OnDestroy {
  private readonly injector = inject(Injector);
  private readonly translatePipe = new TranslatePipe();
  // One nested pipe per placeholder name, created lazily but in this pipe's
  // injection context (TranslatePipe injects in its field initializers).
  private readonly paramPipes = new Map<string, TranslatePipe>();

  transform(value: ErrorTranslation | null | undefined): string {
    if (!value) return '';
    return this.translatePipe.transform(value.key, this.interpolationParams(value)) as string;
  }

  ngOnDestroy(): void {
    this.translatePipe.ngOnDestroy();
    for (const pipe of this.paramPipes.values()) pipe.ngOnDestroy();
  }

  private interpolationParams(value: ErrorTranslation): ErrorTranslation['params'] {
    if (!value.paramKeys) return value.params;
    const params: Record<string, string | number> = { ...value.params };
    for (const [name, key] of Object.entries(value.paramKeys)) {
      params[name] = this.paramPipe(name).transform(key) as string;
    }
    return params;
  }

  private paramPipe(name: string): TranslatePipe {
    let pipe = this.paramPipes.get(name);
    if (!pipe) {
      pipe = runInInjectionContext(this.injector, () => new TranslatePipe());
      this.paramPipes.set(name, pipe);
    }
    return pipe;
  }
}
