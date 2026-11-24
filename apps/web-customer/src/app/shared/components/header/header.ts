import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher, Logo, ThemeSwitcher } from '@WebUi';

// The app bar of the scaffold: the placeholder logo plus the shared theme and
// language switches. Navigation links join it with the first real feature.
@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslatePipe, LanguageSwitcher, Logo, ThemeSwitcher],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
