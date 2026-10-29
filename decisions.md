# Decisioni

- 2026-10-16 — Sito statico senza build (solo `index.html`) — GitHub Pages lo serve direttamente, nessun passo di compilazione da mantenere.
- 2026-10-16 — Pubblicazione da branch `main`, cartella root — configurazione più semplice rispetto a GitHub Actions per un sito statico.
- 2026-10-16 — Aggiunto `.nojekyll` — evita che Jekyll ignori file o cartelle che iniziano con `_`.
- 2026-10-16 — Sito pubblico = build Vite (React + TypeScript) pubblicata su Pages; il server Express con il traduttore resta solo locale — gli strumenti sono React, il build statico è l'unico modo per servirli su Pages.
- 2026-10-16 — Endpoint `/api/translate` protetto con limite di 20 richieste/min per IP, testo max 5000 caratteri e whitelist delle lingue — evita consumo incontrollato della quota Gemini se il server viene esposto.
- 2026-10-16 — Strumenti caricati con `React.lazy` — bundle principale passato da ~657 KB a ~413 KB (gzip ~128 KB), warning di Vite rimosso.
- 2026-10-29 — Landing riscritta in moduli (`Landing`, `ToolModal`, `theme`, `registry`) con output identico alla versione precedente — verificato confrontando classi, testi e posizioni nei tre stili a 375px.
- 2026-10-29 — Tutti gli strumenti riscritti con un kit UI condiviso (`src/ui`) che legge il tema attivo — coerenza di colori, font e bordi tra strumenti e landing, senza classi di colore fisse nei singoli file.
- 2026-10-29 — Generatore QR locale con `qrcode-generator` (nessun servizio esterno) — la password Wi-Fi non lascia più il browser.
- 2026-10-29 — Rimosse le finte funzioni: traduttore senza dizionario di ripiego, crypto senza rumore casuale sui prezzi, NASDAQ marcato come dati dimostrativi — non mostrare come reale ciò che non lo è.
- 2026-10-29 — Aggiunti `@types/react` e `@types/react-dom` — il type-check ora copre davvero i componenti.
