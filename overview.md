# Overview dei file

- `index.html` — entry HTML di Vite (monta `src/main.tsx`).
- `src/` — app React: `App.tsx` (shell, modali, menu), `components/` (un file per strumento, caricati in lazy), `index.css`, `vite-env.d.ts` (tipi Vite).
- `server.ts` — server Express locale: serve Vite in sviluppo e l'API `/api/translate` (Gemini). Non è usato su Pages.
- `vite.config.ts` — config Vite; `base` cambia con `VITE_PUBLIC=1` (sottocartella `/All-in-one/` per Pages).
- `package.json` / `package-lock.json` — dipendenze e script (`dev`, `build`, `lint`).
- `tsconfig.json` — config TypeScript (`npm run lint` = `tsc --noEmit`).
- `.github/workflows/pages.yml` — build statico e deploy su GitHub Pages a ogni push su `main`.
- `.nojekyll` — file vuoto: dice a GitHub Pages di non usare Jekyll.
- `.gitignore` — esclude dipendenze, build, segreti (`.env`, chiavi) ed file di editor.
- `README.md` — cos'è il progetto, come si avvia, come si pubblica su Pages.
- `CLAUDE.md` — regole per l'AI in questo progetto.
- `decisions.md` — elenco delle scelte importanti.
- `metadata.json` — metadati dell'app (origine AI Studio).
