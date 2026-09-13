import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CounterStore } from '../../core/store/counter.store';

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, ButtonModule, CardModule],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly counter = inject(CounterStore);
}
