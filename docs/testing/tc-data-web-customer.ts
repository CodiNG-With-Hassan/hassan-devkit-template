// Acceptance test cases for web-customer, in English and Dutch — the quality gate of this
// project (see .claude/CLAUDE.md). Every change to user-facing behaviour updates the cases here;
// regenerate the workbooks with `pnpm test-cases:generate` (they are gitignored artifacts —
// commit this file only). One area per epic, case IDs `<AREA>-<nn>`; never reuse an area key.
import { tc, type Area, type KnownIssue, type Readme } from '@coding-with-hassan/devkit/test-cases';

export const WEB_CUSTOMER_AREAS: Area[] = [
  {
    key: 'SH',
    name: { en: 'Site shell', nl: 'Site-schil' },
    tab: '3F3F46',
    cases: [
      tc(
        'SH-01',
        'H',
        'The start page arrives rendered and keeps the visitor’s choices',
        'De startpagina komt gerenderd binnen en onthoudt de keuzes van de bezoeker',
        'The site is running. The browser has no saved language or theme for it.',
        'De site draait. De browser heeft er geen taal of thema voor opgeslagen.',
        '1. Open the site in the browser.\n2. Open the page source (View Page Source).\n3. Back on the page, switch the language to Nederlands in the bar at the top.\n4. Click the theme switch.\n5. Reload the page.',
        '1. Open de site in de browser.\n2. Open de paginabron (Paginabron weergeven).\n3. Zet terug op de pagina de taal in de balk bovenaan op Nederlands.\n4. Klik op de themaschakelaar.\n5. Laad de pagina opnieuw.',
        'After step 1 the page shows the logo, the theme switch, the language switch and the title "Template" with its introduction in English on a light background. In step 2 the source already contains that title and introduction as text, not translation keys. After step 3 every text is in Dutch. After step 4 the page is dark. After step 5 the page is still in Dutch and dark.',
        'Na stap 1 toont de pagina het logo, de themaschakelaar, de taalkeuze en de titel "Template" met de inleiding in het Engels op een lichte achtergrond. In stap 2 bevat de bron die titel en inleiding al als tekst, niet als vertaalsleutels. Na stap 3 is alle tekst Nederlands. Na stap 4 is de pagina donker. Na stap 5 is de pagina nog steeds Nederlands en donker.',
      ),
    ],
  },
];

export const WEB_CUSTOMER_KNOWN_ISSUES: KnownIssue[] = [];

export const WEB_CUSTOMER_README: Readme = {
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
