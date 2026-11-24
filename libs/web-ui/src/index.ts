// Public surface of the shared web UI lib. Apps import from '@WebUi'
// (tsconfig path alias). The theme-switcher SERVICE is exported under an
// alias because the theme-switcher COMPONENT owns the plain class name.
export * from './components/language-switcher/language-switcher';
export * from './components/logo/logo';
export * from './components/signal-field-errors/signal-field-errors';
export * from './components/theme-switcher/theme-switcher';
export * from './pipes/translate-error.pipe';
export * from './services/language-storage';
export * from './services/language-sync';
export { ThemeSwitcher as ThemeSwitcherService } from './services/theme-switcher';
