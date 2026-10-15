# All in one

Strumenti quotidiani (calcoli, convertitori, produttività, utilità), in un'unica pagina.

- Sito pubblico: https://trueshape.github.io/All-in-one/ (senza Traduttore: richiede il server locale)

## Avvio in locale

1. Installa Node.js (versione LTS).
2. Nella cartella del progetto: `npm install`.
3. Per il Traduttore: crea `.env.local` con `GEMINI_API_KEY=la-tua-chiave` (non va nel repo).
4. Avvia: `npm run dev`, poi apri http://localhost:3000.

## Pubblicazione

Il workflow `.github/workflows/pages.yml` pubblica la versione statica a ogni push su `main`.
