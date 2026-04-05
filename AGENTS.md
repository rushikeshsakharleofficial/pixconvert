# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React application with a small Node/Express server.

- `src/` contains the frontend application.
- `src/components/` holds route-level tools and shared UI such as `DropZone.jsx`.
- `src/components/ui/` holds shadcn-style UI primitives and the PDF preview upload card.
- `src/data/` stores static tool metadata such as `toolsData.js`.
- `src/lib/` and `src/utils/` contain reusable PDF and conversion helpers.
- `public/` contains static assets served as-is.
- `docs/` stores design notes and implementation plans.
- `server.js` runs the backend endpoints used by contact or server-side flows.
- `dist/` is build output and should not be edited manually.

Before broad exploration, read [.codex/CODE_GRAPH.md](/C:/Users/rishi.DESKTOP-3IFP6MN.000/projects/fileconverter/.codex/CODE_GRAPH.md). It is the repo-local code graph shortcut for route mapping, PDF tool hotspots, and shared helpers.

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server for the frontend.
- `npm run server`: run the local Express server from `server.js`.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint across the repo.

Use `npm run dev` for UI work and run `npm run lint` plus `npm run build` before opening a PR.

## Coding Style & Naming Conventions
Use ES modules, React function components, and 2-space indentation. Prefer `.jsx` for React components and keep component names in PascalCase, for example `ComparePdf.jsx`. Utility modules should use clear camelCase names. Follow the existing pattern of one main component per file in `src/components/`.

ESLint is configured in [`eslint.config.js`](/C:/Users/rishi.DESKTOP-3IFP6MN.000/projects/fileconverter/eslint.config.js). Address warnings where practical, especially `no-unused-vars` and React Hooks rules.

## Testing Guidelines
There is currently no dedicated automated test script in `package.json`. For now, treat `npm run lint` and `npm run build` as the minimum validation gate. When changing UI behavior, also do a manual browser check through the relevant tool route, such as `/tools/sign-pdf`.

If you add automated tests later, keep them close to the feature they cover and name them after the component or module under test.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `feat:` and `fix:`. Continue that style with short, imperative summaries, for example `feat: add PDF compare diff legend`.

PRs should include:
- A short description of the user-facing change.
- Linked issue or task reference when available.
- Screenshots or short recordings for visible UI changes.
- Notes about validation performed, such as `npm run lint` and `npm run build`.
