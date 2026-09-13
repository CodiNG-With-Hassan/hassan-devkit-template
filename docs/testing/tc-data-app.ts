// Bilingual acceptance test cases — the quality gate of this project (see CLAUDE.md).
// Every change to user-facing behaviour updates the cases here; regenerate the workbooks with
// `hassan-devkit test-cases:generate` (they are gitignored artifacts — commit this file only).
// One file per suite (`tc-data-<suite>.ts`), one area per epic, case IDs `<AREA>-<nn>`.
import { tc, type Area, type KnownIssue, type Readme } from '@coding-with-hassan/devkit/test-cases';

export const APP_AREAS: Area[] = [
  {
    key: 'AUTH',
    name: { en: 'Authentication', nl: 'Authenticatie' },
    tab: '1F3864',
    cases: [
      tc('AUTH-01', 'H', 'Sign in with valid credentials', 'Inloggen met geldige gegevens', 'A user account exists.', 'Er bestaat een gebruikersaccount.', '1. Open the sign-in page.\n2. Enter the credentials and submit.', '1. Open de inlogpagina.\n2. Vul de gegevens in en verzend.', 'The user lands on the start page, signed in.', 'De gebruiker komt ingelogd op de startpagina.'),
    ],
  },
];

export const APP_KNOWN_ISSUES: KnownIssue[] = [];

export const APP_README: Readme = {
  en: [['How to test', ['Work through every sheet; set Status per case and note findings in Notes.']]],
  nl: [['Hoe te testen', ['Loop elk tabblad door; zet per test de Status en noteer bevindingen bij Notities.']]],
};
