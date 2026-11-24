import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeSwitcher as ThemeSwitcherService } from '../../services/theme-switcher';

/**
 * Light/dark switch: a round icon button (sun in light mode, moon in dark).
 * Its labels live in each app's shared catalog (`SHARED.COMPONENTS.THEME`).
 */
@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class ThemeSwitcher {
  protected readonly themeService = inject(ThemeSwitcherService);
}
