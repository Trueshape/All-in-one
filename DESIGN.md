---
name: Il sito è mio
description: Raccolta di strumenti da browser, un'unica interfaccia scura in tre stili selezionabili.
colors:
  accent-indaco: "#615fff"
  accent-indaco-chiaro: "#7776ff"
  accent-indaco-testo: "#a5a4ff"
  accent-smeraldo: "#10b981"
  accent-smeraldo-testo: "#34d399"
  accent-viola: "#8b5cf6"
  accent-viola-testo: "#a78bfa"
  fondo-nero-caldo: "#0a0a0a"
  fondo-notte-verde: "#02050a"
  fondo-pannello-verde: "#030812"
  fondo-notte-blu: "#090d16"
  fondo-ardesia: "#0f172a"
  bordo-zinco: "#27272a"
  bordo-ardesia: "#1e293b"
  bordo-bosco: "#064e3b"
  testo-zinco: "#f4f4f5"
  testo-zinco-medio: "#a1a1aa"
  testo-zinco-spento: "#71717a"
  testo-menta: "#6ee7b7"
  testo-bosco-spento: "#047857"
  testo-ardesia: "#f1f5f9"
  testo-ardesia-spento: "#94a3b8"
  errore: "#f87171"
typography:
  title-tool:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 300
  title-card-artistic:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 300
  title-card-immersive:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.25rem"
    fontWeight: 700
    letterSpacing: "0.05em"
  title-card-sophisticated:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
  description:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    lineHeight: 1.625
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  sm: "4px"
  chip: "8px"
  control: "12px"
  panel: "16px"
spacing:
  card-x: "16px"
  stack: "20px"
  modal: "24px"
components:
  button-primary-artistic:
    backgroundColor: "{colors.accent-indaco}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-artistic-hover:
    backgroundColor: "{colors.accent-indaco-chiaro}"
  button-primary-sophisticated:
    backgroundColor: "{colors.accent-viola}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-immersive:
    textColor: "{colors.testo-menta}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  input-artistic:
    textColor: "{colors.testo-zinco}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input-immersive:
    textColor: "{colors.testo-menta}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  input-sophisticated:
    textColor: "{colors.testo-ardesia}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  chip-artistic:
    textColor: "{colors.testo-zinco-spento}"
    rounded: "{rounded.chip}"
    padding: "4px 10px"
  chip-artistic-active:
    textColor: "{colors.accent-indaco-testo}"
    rounded: "{rounded.chip}"
    padding: "4px 10px"
  modal-artistic:
    backgroundColor: "{colors.fondo-nero-caldo}"
    rounded: "{rounded.chip}"
    padding: "{spacing.modal}"
---

# Design System: Il sito è mio

## Overview

**Creative North Star: "Il cassetto degli attrezzi"**

Il sito è un cassetto ordinato: si apre, si prende lo strumento giusto, si usa e si richiude. Ogni strumento vive in una finestra sopra la home e deve essere pronto subito, senza spiegazioni in primo piano e senza scorrere. La personalità sta nella precisione: controlli piccoli e densi, il colore solo sull'azione principale, nomi brevi.

Lo stesso cassetto ha tre finiture che l'utente può scegliere. **Artistic** è il neutro quasi nero con titoli sottili e griglia a filo. **Immersive** è il terminale verde su nero, tutto monospazio e tutto ad angoli vivi. **Sophisticated** è l'ardesia blu con accento viola, angoli morbidi e vetro sfocato sulle schede. Cambiano colore, forma e carattere, mai la struttura: posizione, ordine e comportamento dei controlli restano identici.

Il sito è sempre scuro: non esiste una versione chiara.

**Key Characteristics:**
- Tre finiture, una sola struttura.
- Controlli piccoli e densi, gerarchia data da dimensione e tono.
- Livelli piatti separati da bordi, con ombra solo su ciò che galleggia.
- Ogni strumento entra in una finestra da 2560×1300 senza scorrere.
- Nessun menu nativo del browser.

## Colors

Fondi quasi neri con una leggera tinta di finitura, un solo accento per finitura e colori di stato uguali ovunque.

### Primary
- **Indaco elettrico** (`accent-indaco`): azione principale, cursori e grafici degli strumenti in Artistic. La home di Artistic resta grigia: l'accento compare solo dentro gli strumenti.
- **Smeraldo terminale** (`accent-smeraldo`): accento di Immersive, usato anche come tinta trasparente dei bottoni invece che pieno.
- **Viola ardesia** (`accent-viola`): accento di Sophisticated, sui bottoni pieni e sulla scheda attiva.

### Neutral
- **Nero caldo** (`fondo-nero-caldo`): pagina, schede e finestre di Artistic.
- **Notte verde** (`fondo-notte-verde`, `fondo-pannello-verde`): pagina e finestre di Immersive.
- **Notte blu e ardesia** (`fondo-notte-blu`, `fondo-ardesia`): pagina e finestre di Sophisticated.
- **Bordi di finitura** (`bordo-zinco`, `bordo-bosco`, `bordo-ardesia`): unico separatore tra i livelli.
- **Testi su tre livelli**: chiaro per valori e titoli, medio per descrizioni, spento per etichette (zinco, menta/bosco, ardesia secondo la finitura).

### Named Rules
**The One Accent Rule.** Ogni finitura ha un solo accento. Un secondo colore compare solo per dare uno stato (errore, avviso, successo), e i colori di stato sono uguali in tutte le finiture.

**The Token Rule.** I colori degli strumenti arrivano da `useUi()`. Un colore scritto a mano in un componente vale per una sola finitura e rompe le altre due.

## Typography

**Display Font:** Outfit (con sans-serif), per titoli degli strumenti e valori in evidenza
**Body Font:** Inter (con ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono (con ui-monospace)

**Character:** Inter dà le descrizioni leggibili, JetBrains Mono dà a etichette e numeri il tono da strumento di misura. In Immersive il monospazio copre tutto; in Sophisticated lascia il posto a Inter anche nei controlli.

### Hierarchy
- **Title** (300–700 secondo la finitura, 1,25–1,5rem): titolo delle schede. Sottile in Artistic, maiuscolo e spaziato in Immersive, semibold compatto in Sophisticated.
- **Body** (400, 0,875rem): testo nei campi e nei menu.
- **Description** (400, 0,75rem, interlinea 1,625): descrizione delle schede.
- **Label** (0,625rem, maiuscolo, spaziatura 0,1em): etichette dei campi, indici e bottoni in Artistic e Immersive. In Sophisticated diventa 0,75rem, peso 500, senza maiuscolo.

### Named Rules
**The Small Label Rule.** Etichette e bottoni sono piccoli di proposito: la gerarchia è data dal valore o dal risultato, non dal controllo che lo produce.

## Layout

La home mostra le categorie in griglia: una colonna su telefono, due da 768 px, tre da 1024 px, tutte affiancate da 1500 px. Le pagine di categoria usano la stessa griglia con altezza data dal contenuto. L'intestazione tiene la ricerca al centro della pagina e lingua e stile a destra.

Gli strumenti si aprono in una finestra centrata, alta al massimo il 90% dello schermo, con corpo da 24 px di margine interno e una larghezza scelta per strumento (da 576 a 1152 px). Il contenuto scorre solo dentro i suoi riquadri. La verticale tra i blocchi è di 20 px.

### Named Rules
**The No-Scroll Rule.** Su 2560×1300 nessuno strumento scorre nello stato iniziale. Se non entra, si allarga la finestra; gli elenchi lunghi scorrono nel proprio riquadro.

**The Balanced Columns Rule.** Due colonne non differiscono oltre circa 150 px e 1,4 volte in altezza. Si misura il contenuto, non la cella della griglia. Se sono sbilanciate, si passa a una colonna sola o si spostano i blocchi secondari in quella più corta.

## Elevation & Depth

Il sistema è piatto: i livelli si distinguono per bordo e tono del fondo. L'unica ombra strutturale è quella ampia di finestre e menu aperti. Sophisticated aggiunge una sfocatura di vetro su intestazione e schede e, al passaggio del mouse, un alone viola quasi invisibile.

### Named Rules
**The Flat Until It Floats Rule.** Solo ciò che sta sopra la pagina ha un'ombra: finestre, menu e liste aperte.

## Shapes

La forma è il tratto più riconoscibile di ogni finitura. Immersive ha angoli vivi su tutto. Artistic ha griglia e schede a filo in home, finestra a 8 px e controlli degli strumenti morbidi (campi e bottoni a 12 px, chip a 8 px, pannelli a 16 px). Sophisticated ha schede e pannelli a 16 px e controlli a 12 px.

## Components

### Buttons
Sobri e precisi: piccoli, densi, una sola azione colorata per zona.
- **Shape:** quella della finitura.
- **Primary:** accento pieno con testo bianco in Artistic e Sophisticated, tinta trasparente con bordo in Immersive.
- **Hover / Focus:** cambia il tono del fondo o del bordo; a riposo disabilitato al 40% di opacità.
- **Secondary / Ghost / Danger:** fondo di finitura con bordo; trasparente senza bordo; testo rosso con bordo rosso tenue.
- **Etichette:** i bottoni di download si chiamano solo col formato (PNG, SVG, .ttf).

### Chips
- **Style:** bordo sottile, testo spento, piccolo.
- **State:** selezionato con bordo e testo d'accento su tinta tenue.

### Cards / Containers
- **Corner Style:** quello della finitura.
- **Background:** fondo di finitura, trasparenze tenui per i pannelli, più scuro per i pannelli incassati.
- **Shadow Strategy:** nessuna a riposo.
- **Border:** sottile, sempre di finitura.
- **Internal Padding:** schede 12 px sopra e 16 px ai lati; pannelli 16 px.

### Inputs / Fields
- **Style:** fondo quasi trasparente, bordo sottile, testo monospazio (Inter in Sophisticated).
- **Focus:** il bordo si schiarisce o prende l'accento.
- **Error / Disabled:** gli errori stanno in un avviso sotto il campo; disabilitato al 50%.

### Navigation
Categorie in fila nell'intestazione: testo piccolo, spento a riposo, chiaro con filetto inferiore sulla voce attiva. Il menu lingua mostra solo la bandiera; i nomi compaiono nella lista aperta.

### Select
Sostituisce il menu nativo: bottone con l'aspetto del campo e lista in sovrimpressione con fondo, raggio e font della finitura, con navigazione da tastiera e spunta sulla voce scelta.

### Finestra dello strumento
Testata con nome e categoria, azioni (informazioni, preferito, chiudi), corpo e piede con Precedente/Successivo e posizione. Le note d'uso stanno dietro il pulsante informazioni, non nel corpo.

## Do's and Don'ts

### Do:
- **Do** prendere colori, raggi e font da `useUi()` negli strumenti e da `getThemeClasses()` nella home.
- **Do** controllare ogni modifica in tutte e tre le finiture.
- **Do** usare `Select` di `src/ui/kit.tsx` per ogni menu a tendina.
- **Do** chiamare i bottoni di download solo col formato.
- **Do** misurare l'altezza del contenuto delle colonne, non delle celle.

### Don't:
- **Don't** usare menu a tendina nativi del browser.
- **Don't** scrivere "Scarica PNG" o simili su un bottone.
- **Don't** far scorrere uno strumento nello stato iniziale su 2560×1300.
- **Don't** aggiungere un secondo accento a una finitura.
- **Don't** cambiare posizione o ordine dei controlli tra una finitura e l'altra.
