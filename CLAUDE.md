# Regole per l'AI in questo progetto

- Il sito pubblico è una build statica di Vite (React + TypeScript) servita da GitHub Pages. Non aggiungere dipendenze senza motivo e non introdurre backend nel build pubblico.
- Il traduttore usa `server.ts` (Express + Gemini) solo in locale; con `VITE_PUBLIC=1` è disattivato.
- Mantieni il `base` di `vite.config.ts` (`/All-in-one/` per Pages): non cambiarlo senza aggiornare il deploy.
- Non committare chiavi, token o file `.env`.
- Ogni nuovo file va elencato in [overview.md](overview.md).
- Ogni scelta importante va registrata in [decisions.md](decisions.md).
- Nessuno strumento deve eccedere la finestra di un browser su un PC 2560×1440 (viewport circa 2560×1300 con le barre del browser, più il padding del modale sui 4 lati): nello stato iniziale non ci dev'essere scorrimento interno, né in altezza né in larghezza. Usa lo spazio in larghezza (colonne, modale più largo in `getToolModalSize` di `src/theme.ts`); gli elenchi lunghi scorrono dentro il loro riquadro. Controlla ogni strumento nuovo o modificato.
- Niente menu a tendina nativi del browser: usa `Select` di `src/ui/kit.tsx`, che disegna la lista con forma e colori del tema del sito.
