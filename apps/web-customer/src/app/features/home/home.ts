import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// Placeholder start page of the scaffold: proves the shell renders with the
// theme and the translated catalogs. Replace it with the first real feature.
@Component({
  selector: 'app-home',
  imports: [TranslatePipe],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
