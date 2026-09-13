# Shared libraries

Workspace packages shared by more than one app go here, one folder per lib with its own
`package.json` (`"name"` = the folder name, `"private": true`) — pnpm picks them up through the
`libs/*` entry in `pnpm-workspace.yaml`, Nx through the workspace, and the devkit derives the
commit scope, lint-staged targets and CI plan from the folder.

Two ways to consume a lib from an app:

- **As a real dependency** (`"my-lib": "workspace:*"` in the app's `package.json`) when the
  lib has a build or is framework-agnostic.
- **As source** through a tsconfig path alias when the lib is Angular UI compiled by the
  consuming app; then list the lib in the app's `nx.implicitDependencies` so caching and
  `affected` stay correct.

Add every new lib's `package.json` to the `COPY` list of each Dockerfile under `docker/`:
`pnpm install --frozen-lockfile` needs all importers present, even for a filtered install.
