# assets

Shared static assets for the web apps.

```
src/
  images/no-image.svg, no-image-dark.svg  # image placeholders
```

## How apps consume it

1. Declare it as a real dependency: `"assets": "workspace:*"` — pnpm symlinks it into the app's
   `node_modules`, and the Nx graph picks up the edge automatically (no `implicitDependencies`
   needed).
2. Map it into the bundle in `angular.json`:

```json
{ "glob": "**/*", "input": "node_modules/assets/src", "output": "assets" }
```

Files then keep stable URLs (`/assets/images/...`).

Why `node_modules/...` and not a relative `../../libs/assets` input: each app has its own
`angular.json`, and the Angular builder rejects asset inputs outside the app's root — the
symlinked package path is inside it. App-specific files (favicons, per-app i18n JSON) stay in
each app's own `public/`.

A new workspace package goes into the `COPY` list of every dev Dockerfile (`.claude/CLAUDE.md` →
Docker).

## Logo

There is no logo yet: the apps render the placeholder `<app-logo />` wordmark from `@WebUi`
(inline SVG, so it follows `currentColor`). Put the real SVG master here when the brand exists
and point the component at it.
