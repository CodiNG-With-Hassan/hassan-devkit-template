import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const STORAGE_KEY = 'theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeSwitcher {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isDarkMode = signal(false);

  readonly noImageUrl = computed(() =>
    this.isDarkMode() ? '/assets/images/no-image-dark.svg' : '/assets/images/no-image.svg',
  );

  /**
   * Applies the stored choice, or `defaultDark` when the user never toggled.
   * An app that defaults to dark also sets `class="dark-mode"` in its
   * index.html, so server-rendered output does not flash light.
   */
  initialize({ defaultDark = false }: { defaultDark?: boolean } = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isDarkMode.set(defaultDark);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const isDark = stored === null ? defaultDark : stored === 'true';
    this.apply(isDark);
  }

  toggle(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const newValue = !this.isDarkMode();
    this.apply(newValue);
    localStorage.setItem(STORAGE_KEY, `${newValue}`);
  }

  private apply(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    this.document.documentElement.classList.toggle('dark-mode', isDark);
  }
}
