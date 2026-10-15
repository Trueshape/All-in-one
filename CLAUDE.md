# Regole per l'AI in questo progetto

- Il sito pubblico è una build statica di Vite (React + TypeScript) servita da GitHub Pages. Non aggiungere dipendenze senza motivo e non introdurre backend nel build pubblico.
- Il traduttore usa `server.ts` (Express + Gemini) solo in locale; con `VITE_PUBLIC=1` è disattivato.
- Mantieni il `base` di `vite.config.ts` (`/All-in-one/` per Pages): non cambiarlo senza aggiornare il deploy.
- Non committare chiavi, token o file `.env`.
- Ogni nuovo file va elencato in [overview.md](overview.md).
- Ogni scelta importante va registrata in [decisions.md](decisions.md).
