# theme

The brand tokens, shared by every web app. Never built — consumed as source.

| File                    | Consumed by                            | How                                                         |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------- |
| `src/primeng.preset.ts` | web apps (`web-customer`, `web-admin`) | `@Theme` tsconfig path alias (same pattern as `@ApiClient`) |

`primeng.preset.ts` is the **SOURCE OF TRUTH**. The template has no brand, so the preset is the
stock Aura theme with a neutral placeholder primary ramp (zinc). Replace the values there when
the project has a design system; nothing outside that file hardcodes them. Typography is wired
per app in `src/styles.css` (Inter, self-hosted through `@fontsource-variable/inter`, as the
placeholder).

Every consuming app must list `theme` in its `package.json` `nx.implicitDependencies` — that is
what invalidates Nx's build cache and makes `pnpm affected` rebuild consumers when the theme
changes. Add the entry when creating a new frontend app.

Besides the Aura semantic overrides the preset carries one custom token group under `extend`:
`status`, described below (`--p-status-*`).

## Contrast rules baked into the tokens

- **Primary** — light mode uses `primary.950` as `primary.color` with white text, dark mode
  `primary.50` with `primary.950` text. A brand ramp usually needs its 600 or 700 step in light
  mode: check that white text reaches 4.5:1 on the step you pick.
- **Status tints** — `--p-status-{success|info|warn|danger|secondary}-{color|background}`
  (preset `extend.status`): the Aura tag recipe, 700-step text on the 100-step wash in light,
  300-step text on a 16 % wash in dark. Use them for hand-made pills, banners and field errors
  instead of pairing white with a 500-step colour. `secondary` is the neutral tone for statuses
  without a severity.

The `@primeuix/themes` dependency mirrors the web apps' range — bump them together.
