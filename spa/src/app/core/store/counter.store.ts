import { computed } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';

/**
 * Sample @ngrx/signals store. Delete this when you start building real features.
 * Kept here only as a working reference for new client projects.
 */
type CounterState = { count: number };

const initialState: CounterState = { count: 0 };

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ count }) => ({
    doubled: computed(() => count() * 2),
  })),
  withMethods((store) => ({
    increment: () => patchState(store, { count: store.count() + 1 }),
    decrement: () => patchState(store, { count: store.count() - 1 }),
    reset: () => patchState(store, initialState),
  })),
);
