# Decisioni

- 2026-10-16 — Sito statico senza build (solo `index.html`) — GitHub Pages lo serve direttamente, nessun passo di compilazione da mantenere.
- 2026-10-16 — Pubblicazione da branch `main`, cartella root — configurazione più semplice rispetto a GitHub Actions per un sito statico.
- 2026-10-16 — Aggiunto `.nojekyll` — evita che Jekyll ignori file o cartelle che iniziano con `_`.
- 2026-10-16 — Sito pubblico = build Vite (React + TypeScript) pubblicata su Pages; il server Express con il traduttore resta solo locale — gli strumenti sono React, il build statico è l'unico modo per servirli su Pages.
- 2026-10-16 — Endpoint `/api/translate` protetto con limite di 20 richieste/min per IP, testo max 5000 caratteri e whitelist delle lingue — evita consumo incontrollato della quota Gemini se il server viene esposto.
- 2026-10-16 — Strumenti caricati con `React.lazy` — bundle principale passato da ~657 KB a ~413 KB (gzip ~128 KB), warning di Vite rimosso.
