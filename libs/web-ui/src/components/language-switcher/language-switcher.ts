import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  PLATFORM_ID,
  signal,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_OPTIONS,
  type SupportedLanguage,
} from 'tpl-i18n';
import { LANGUAGE_STORAGE_KEY } from '../../services/language-storage';
import { LANGUAGE_SYNC_HANDLER } from '../../services/language-sync';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [Select, FormField],
  host: { '[class.language-switcher-compact]': 'compact()' },
})
export class LanguageSwitcher {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translateService = inject(TranslateService);
  // Optional app-provided hook that persists the choice on the logged-in
  // user's profile; absent (or logged out) the choice stays local.
  private readonly languageSync = inject(LANGUAGE_SYNC_HANDLER, { optional: true });

  // Phone widths only (below Tailwind's `sm`, 640 px): the trigger shrinks to
  // the flag. From `sm` up it always names the language — a bare flag reads
  // as two letters on Windows, which has no flag emoji.
  readonly compact = input(false);
  protected readonly options = LANGUAGE_OPTIONS;
  private readonly language = signal<SupportedLanguage>(this.appliedLanguage());
  protected readonly languageField = form(this.language);

  // Fires on USER language changes only (not the bootstrap apply) — hosts
  // hook this to react to the choice, e.g. to reload data that depends on
  // the language.
  readonly languageChanged = output<SupportedLanguage>();

  constructor() {
    // skip(1): only react to user changes — the app applies the saved
    // language at bootstrap, and rewriting localStorage with it is noise.
    toObservable(this.language)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((lang) => {
        this.translateService.use(lang);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
          this.languageSync?.syncLanguage(lang);
        }
        this.languageChanged.emit(lang);
      });
  }
  // The language the app applied at bootstrap, on the server as in the
  // browser — not necessarily the device's saved one.
  private appliedLanguage(): SupportedLanguage {
    const current = this.translateService.getCurrentLang();
    return isSupportedLanguage(current) ? current : DEFAULT_LANGUAGE;
  }
}
