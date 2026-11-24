// Acceptance test cases for web-admin, in English and Dutch — the quality gate of this project
// (see .claude/CLAUDE.md). Every change to user-facing behaviour updates the cases here;
// regenerate the workbooks with `pnpm test-cases:generate` (they are gitignored artifacts —
// commit this file only). One area per epic, case IDs `<AREA>-<nn>`; never reuse an area key.
import { tc, type Area, type KnownIssue, type Readme } from '@coding-with-hassan/devkit/test-cases';

export const WEB_ADMIN_AREAS: Area[] = [
  {
    key: 'SH',
    name: { en: 'App shell', nl: 'App-schil' },
    tab: '3F3F46',
    cases: [
      tc(
        'SH-01',
        'H',
        'The start page opens with its shell',
        'De startpagina opent met de schil',
        'The app is running. The browser has no saved language or theme for it.',
        'De app draait. De browser heeft er geen taal of thema voor opgeslagen.',
        '1. Open the app in the browser.\n2. In the bar at the top, switch the language to Nederlands.\n3. Click the theme switch.\n4. Reload the page.',
        '1. Open de app in de browser.\n2. Zet in de balk bovenaan de taal op Nederlands.\n3. Klik op de themaschakelaar.\n4. Laad de pagina opnieuw.',
        'After step 1 the page shows the logo, the theme switch, the language switch and the title "Template admin" in English on a light background. After step 2 every text is in Dutch (title "Template-beheer"). After step 3 the page is dark. After step 4 the page is still in Dutch and dark.',
        'Na stap 1 toont de pagina het logo, de themaschakelaar, de taalkeuze en de titel "Template admin" in het Engels op een lichte achtergrond. Na stap 2 is alle tekst Nederlands (titel "Template-beheer"). Na stap 3 is de pagina donker. Na stap 4 is de pagina nog steeds Nederlands en donker.',
      ),
    ],
  },
];

export const WEB_ADMIN_KNOWN_ISSUES: KnownIssue[] = [];

export const WEB_ADMIN_README: Readme = {
  en: [
    ['How to test', ['Work through every sheet; set Status per case and note findings in Notes.']],
  ],
  nl: [
    [
      'Zo test je',
      ['Loop elk tabblad door; zet per case de Status en noteer bevindingen bij Notities.'],
    ],
  ],
};
