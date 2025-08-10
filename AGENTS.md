# Repository Guidelines

## Project Structure & Modules
- `src/`: TypeScript source
  - `index.ts`: plugin entry
  - `renderers/`: codeblock and task renderers
  - `components/`: dock/panel UI logic and styles
  - `utils/`, `types/`, `i18n/`: helpers, typings, locale JSON
- `dist/`: built plugin (bundled by Vite)
- `asset/`, `icon.png`, `preview.png`: assets used in release
- `plugin.json`: Siyuan plugin manifest (name, version, i18n)
- `examples/`: sample snippets and usage

## Build, Test, and Development
- Install deps: `npm i` (or `pnpm i`)
- Dev (watch to Siyuan workspace):
  - Set `VITE_SIYUAN_WORKSPACE_PATH` in `.env` (see `.env.example`).
  - Run `npm run dev` (or `pnpm run dev`) to build in watch mode to `data/plugins/<name>`.
- Build release: `npm run build`
- Version + tag helper: `npm run release` (also supports `:patch|:minor|:major|:manual`)
- Optional copy target: set `VITE_CUSTOM_BUILD_PATH` to mirror `dist/` after build.

## Coding Style & Conventions
- Language: TypeScript, Vue runtime available (no SFCs required).
- Indentation: 2 spaces; Quotes: single. Enforced via `eslint` with `@antfu` config.
- Run lint locally: `npx eslint "src/**/*.{ts,vue}"`
- Filenames: kebab- or camel-case for modules, `*.ts` for logic, `*.scss` for styles.
- i18n: add keys to `src/i18n/*.json`; keep all locales in sync.

## Testing Guidelines
- Automated tests are not set up yet. For manual verification:
  - Start Siyuan, load plugin from `dist/` or dev path.
  - Create `tasks` codeblocks and exercise filters, sorting, and UI actions.
  - Watch the console for errors and confirm no regressions in rendering.

## Commit & PR Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`). Releases use `chore: update version to x.y.z`.
- Keep PRs focused and small. Include:
  - Clear description, linked issues, and rationale
  - Screenshots/GIFs for UI changes
  - Notes on migration or config/env impacts

## Security & Configuration
- Do not commit `.env`. Prefer `.env.example` for new variables.
- Validate user input in renderers/components; avoid unsafe HTML.
- Keep `plugin.json` and i18n files consistent for releases.
