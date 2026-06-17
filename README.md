# Iron Log

A strongman / powerlifting training logbook — installable PWA.

> **Beta name.** "Iron Log" is a working title and may change. The deploy path
> matches the GitHub repo name (`liftlog`) so GitHub Pages resolves correctly.

**Live:** https://jphypno90.github.io/liftlog/

---

## Status

**Phases 0–8 complete.** Design system, typed Zustand store with persistence,
app shell, phase/competition management, session logging, multi-source import,
weekly export + templates, and an installable offline PWA.

### Install (PWA)

Open the [live app](https://jphypno90.github.io/liftlog/) and use your browser's
**Install / Add to Home Screen**. Once installed it launches standalone and works
offline (the app shell, fonts, and data are cached locally; data persists in
`localStorage`).

## Stack

- [Vite 5](https://vitejs.dev/) + [React 18.3](https://react.dev/) + TypeScript 5 (strict)
- [Tailwind 3.4](https://tailwindcss.com/) + PostCSS + autoprefixer — colour tokens
  bound from CSS variables in [`src/styles/tokens.css`](src/styles/tokens.css)
- [Zustand 4.5](https://github.com/pmndrs/zustand) + [lucide-react](https://lucide.dev/) (installed, not yet used)
- ESLint 8 (classic `.eslintrc.cjs`) + Prettier 3

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173/liftlog/)
```

## Scripts

| Command           | What it does                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Start the dev server with HMR                            |
| `npm run build`   | Type-check (`tsc -b`) then build to `dist/`              |
| `npm run preview` | Serve the production build locally                       |
| `npm run lint`    | ESLint over `ts`/`tsx` (zero warnings allowed)           |
| `npm run format`  | Prettier-format the repo                                 |

## Project structure

```
src/
  components/   reusable UI primitives        (empty in Phase 0)
  features/     feature modules / screens     (empty in Phase 0)
  store/        Zustand store                 (empty in Phase 0)
  lib/          helpers, adapters             (empty in Phase 0)
  types/        shared TypeScript types       (empty in Phase 0)
  styles/       tokens.css + Tailwind entry
  App.tsx       Phase 0 placeholder
  main.tsx      React entry
```

The `@/*` import alias maps to `src/*` (see `tsconfig.json` and `vite.config.ts`).

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which runs `npm ci` → `npm run build` and deploys `dist/` to GitHub Pages via
`configure-pages` / `upload-pages-artifact` / `deploy-pages`.

**One-time setup:** in the repo's **Settings → Pages**, set **Source = GitHub Actions**.

Vite's `base` is `/liftlog/` (matching the repo name), so built asset URLs resolve
correctly under the project-site path.
