---
paths:
  - "apps/web-customer/**"
  - "apps/web-admin/**"
  - "libs/web-ui/**"
---

<!-- Angular forms in every FE app and the shared UI lib. Loads only when a matching file is touched. -->

## Angular forms: signal forms only

Every form-related component uses **signal forms** (`@angular/forms/signals`): a `signal()`
model wrapped in `form()` (the model signal stays the single source of truth), schema
validators (`required`, `email`, `maxLength`, `disabled`, …) and `[formField]` bindings —
PrimeNG's CVA components bind to `[formField]` directly.

- **`ngModel`/`FormsModule`/`ReactiveFormsModule` are banned.** Enforced by ESLint
  (`no-restricted-imports` on `FormsModule`, `ReactiveFormsModule` and `FormBuilder` from
  `@angular/forms` in each web app's `eslint.config.js`); a new FE app copies the same block.
- **A custom control's `invalid`, `touched`, `dirty`, `disabled`, `required`, … inputs are
  written by `[formField]`** (the signal-forms control contract, raw field state): never bind
  them by hand next to `[formField]`, and gate the visible marker on touched-or-dirty inside the
  control.
- **Validation messages** are rendered by `<app-signal-field-errors [label]="…" [field]="form.x" />`
  from `@WebUi`: it shows the field's errors once the field is touched or edited, with the texts
  of `SHARED.COMPONENTS.FIELD_ERRORS` in the app's shared catalog. A validator kind the mapping
  in `libs/shared-utils` does not know falls back to the generic "is not valid" text — add the
  kind there and its text to every app's catalog.
