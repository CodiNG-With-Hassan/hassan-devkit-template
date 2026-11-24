import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder "TEMPLATE" wordmark until the project has a logo. Inline SVG so
 * the lettering follows `currentColor` on light and dark surfaces. Size it
 * from the host (`class="h-9"`).
 */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-block', role: 'img', 'aria-label': 'Template' },
})
export class Logo {}
