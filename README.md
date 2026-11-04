# All in one

Strumenti quotidiani (calcoli, convertitori, produttività, utilità), in un'unica pagina.

- Sito pubblico: https://trueshape.github.io/All-in-one/

## Avvio in locale

1. Installa Node.js (versione LTS).
2. Nella cartella del progetto: `npm install`.
3. Avvia: `npm run dev`, poi apri http://localhost:5182.
4. Controlli prima di pubblicare: `npm run lint` (tipi) e `npm test` (test della logica).

## Pubblicazione

Il workflow `.github/workflows/pages.yml` pubblica la versione statica a ogni push su `main`.
