# Finga MVP — stato al 15 settembre 2026

MVP completo, mergiato in `main` (PR #1) e deployato il 30 agosto 2026.
Le modifiche successive sono in [Dopo l'MVP](#dopo-lmvp-1415-settembre-2026).

- **App:** https://finga.lakebed.app (alias: https://quiet-river-26d17aaeef.lakebed.app)
- **Deploy:** `dep_fiiN9C20J2tYgK2v`, owned, senza scadenza
- **Repo:** https://github.com/gorillaradio/finga
- **Spec di riferimento:** [specs/2026-08-30-finga-mvp-design.md](superpowers/specs/2026-08-30-finga-mvp-design.md)
- **Piano eseguito:** [plans/2026-08-30-finga-mvp.md](superpowers/plans/2026-08-30-finga-mvp.md)

## Cosa fa

Propone un pattern di diteggiatura, lo suona in loop (note sintetizzate +
metronomo) mentre l'utente suona insieme, raccoglie un feedback 1–5,
salva lo storico su Lakebed e calcola il profilo di difficoltà per dito.
Traversata standard: pattern su corde 6→1→6 per posizione, posizioni
1→max→1 (default 12).

## Com'è fatto

- `shared/` — TypeScript puro: generazione pattern e profilo per dito
  (`patterns.ts`), sequencer che produce la lista piatta di eventi
  `{string, fret, finger, midi}` (`sequencer.ts`), serializzazione run
  (`runs.ts`), profilo utente pesato su BPM e note/beat (`profile.ts`).
  Audio e UI consumano la stessa lista: il sync è per costruzione.
- `server/` — capsule Lakebed: tabella `runs` (campi stringa più
  `userId()`, indice `by_user`), query `myRuns`, mutation `saveRun`.
- `client/` — Preact: motore audio Web Audio con scheduler lookahead e
  count-in (`audio.ts`), tastiera SVG (`fretboard.tsx`), macchina a
  stati dell'esercizio con pausa/ripresa dal blocco di posizione e
  schermo tenuto acceso (`exercise.tsx`), le quattro schermate e il
  login (`index.tsx`).
- `tests/` — 30 test vitest su shared; `npm run typecheck` copre
  shared+tests (richiede `node_modules`: senza, `tsc` non c'è),
  `npx lakebed build` fa da typecheck per server e client.
- `lakebed.json` — `deployId` del deploy owned, versionato: da un clone
  nuovo `npx lakebed deploy` aggiorna finga.lakebed.app, a patto di aver
  fatto `npx lakebed auth login`. Senza login né `lakebed.json` la CLI
  crea invece un'anteprima anonima nuova.

## Decisioni prese in corso d'opera (oltre la spec)

- `createdAt` è un campo riservato di Lakebed: non sta nello schema, fa
  fede il timestamp del server all'inserimento. Un salvataggio ritentato
  offline prende la data del retry, non dell'esecuzione.
- I cicli `while` sono vietati nel codice server dei deploy anonimi:
  `resumeIndexFor` è un for-loop limitato per questo.
- iOS: `navigator.audioSession.type = "playback"` in `unlock()` fa
  suonare l'app anche con l'interruttore silenzioso attivo (richiede
  iOS ≥ 16.4).
- Tastiera: orizzontale (convenzione tab, cantino in alto) in landscape;
  verticale a diagramma di accordi (capotasto in alto, Mi basso a
  sinistra) in portrait. Capotasto evidenziato con barra chiara quando
  la finestra parte dal tasto 1. Ghost del pattern sulla corda in gioco.
- Schermata feedback: oltre a 1–5 c'è "Scarta esecuzione" (non salva,
  propone un altro pattern).

## Dopo l'MVP (14–15 settembre 2026)

- **Lunghezza del pattern, 4 o 6 note.** Il catalogo fisso non c'è più:
  `patternsOfLength` genera tutte le sequenze che usano le quattro dita
  senza ripetere lo stesso dito di fila (24 da 4 note, 600 da 6).
  Nel setup la scelta parte da 4 e non viene ricordata al ricaricamento.
- **Schermo sempre acceso durante l'esercizio.** Screen Wake Lock
  richiesta all'apertura dell'esercizio (anche in pausa), rilasciata
  all'uscita, richiesta di nuovo quando la pagina torna visibile.
- **Login con Google facoltativo.** Senza login Lakebed tratta l'utente
  come ospite: l'identità sta in un cookie che scade dopo 30 giorni, si
  perde cancellando i dati del browser e non esiste su altri browser o
  dispositivi, e con lei si perde lo storico visibile. Con il login lo
  storico segue l'account. `userId` è di tipo `userId()` perché Lakebed
  sposti sull'account le esecuzioni fatte da ospite al momento del login;
  il login non chiede nome, email né foto (`requestPii={false}`).
- Le esecuzioni salvate prima del login (utente `guest:local` e un
  ospite del 14 settembre) restano nel database ma non sono più
  visibili; per scelta non sono state recuperate. Nel database c'è anche
  un'esecuzione di test (2-4-3-1) di un ospite creato da un Chrome
  automatico durante la verifica del deploy.

## Comandi utili

```sh
npx lakebed dev                      # sviluppo locale su :3000
npx lakebed deploy                   # ridistribuisce su finga.lakebed.app
npx lakebed db export --out backup.json   # backup dello storico
npx lakebed logs dep_fiiN9C20J2tYgK2v     # log del deploy
```

## Follow-up rinviati (non bloccanti)

- La lista dello storico non mostra la data del run.
- Gli input numerici del setup andrebbero clampati su blur, non a ogni
  tasto.
- In portrait la tastiera si ridimensiona quando compaiono/spariscono i
  messaggi "Preparati…" / "In pausa".
- Favicon: residuo di gradiente del template.
- Pulizie minori annotate nelle review (duplicazioni nelle `<line>` di
  `fretboard.tsx`, costante `x=18` per i numeri di tasto verticali,
  inizializzatore non lazy in `useIsPortrait`).

Prossimo passo previsto: raccolta di idee per migliorare il design.
