# Finga MVP — Design

Data: 2026-08-30
Riferimento: [docs/overview.md](../../overview.md)

## Obiettivo

Web app per allenamento tecnico su chitarra basato su pattern di diteggiatura.
L'app propone un pattern, lo **suona in loop** (note sintetizzate + metronomo)
mentre l'utente suona insieme, raccoglie un feedback 1–5 a fine esecuzione e
accumula uno storico da cui calcolare il profilo delle difficoltà per dito.

Requisiti chiave emersi oltre all'overview:

- L'app suona le note del pattern, non solo il click del metronomo.
- Suono sintetizzato: non deve somigliare a una chitarra.
- Deve funzionare su telefono, tablet e computer (web app, touch-first).
- Storico sincronizzato tra dispositivi (backend con storage).
- Tastiera visiva sullo schermo con la nota corrente evidenziata, in sync
  con l'audio. Finestra di **6 tasti visibili**.

## Stack: Lakebed

Capsule Lakebed (full-stack TypeScript: server + client Preact + shared).
Database, auth (guest + Google) e deploy inclusi.

Rischi accettati esplicitamente:

- Piattaforma in fase prototipo: API instabili, export dei dati non
  verificato. Lo storico potrebbe non sopravvivere a cambi di piattaforma.
- Tipi DB limitati a `string()`, `boolean()`, `id()`: i numeri si salvano
  come stringhe, con conversione centralizzata in `shared/`.
- Niente import npm arbitrari nel runtime: tutto il codice deployato è
  senza dipendenze.

## Struttura della capsule

- **`shared/`** — il cuore, TypeScript puro senza dipendenze:
  - catalogo dei pattern (lista curata nel codice, non nel DB);
  - calcolo caratteristiche pattern: dito iniziale, frequenze, profilo
    per dito (pesi euristici, raffinabili dopo l'MVP);
  - **sequencer** (vedi sotto);
  - conversioni numero↔stringa per il DB.
- **`server/`** — magro: mutation di inserimento run, query di lettura
  filtrata per `userId`. Nessuna logica musicale.
- **`client/`** — Preact: macchina a stati dell'esercizio, motore audio,
  tastiera SVG, schermate.

## Modello dati

Una tabella, `runs`, un record per esecuzione:

| campo         | tipo Lakebed | contenuto                              |
|---------------|--------------|----------------------------------------|
| `pattern`     | `string()`   | sequenza per esteso, es. `"3-2-4-2-1-2"` |
| `bpm`         | `string()`   | numero serializzato                    |
| `notesPerBeat`| `string()`   | `"1"` o `"2"`                          |
| `feedback`    | `string()`   | `"1"`–`"5"`                            |
| `createdAt`   | `string()`   | timestamp ISO                          |
| `userId`      | `string()`   | da `ctx.auth` di Lakebed               |

Scelte:

- Si salva la **sequenza per esteso**, non un id di catalogo: il record
  resta valido anche se il catalogo cambia; le caratteristiche si
  ricalcolano sempre dalla sequenza.
- `userId` salvato da subito (Lakebed lo fornisce comunque con la guest
  auth): il multi-utente futuro non richiede migrazioni. MVP senza UI di
  login.
- Il **profilo utente non si salva**: si calcola leggendo i run al momento
  del bisogno. Volumi attesi: migliaia di record al massimo, aggregazione
  istantanea. Niente stato derivato da tenere sincronizzato.

## Sequencer (`shared/`)

Funzione pura: `(pattern, config) → lista ordinata di eventi`.
Ogni evento: `{ corda, tasto, dito, indiceTemporale }`.

Config: `maxFret` (default 12), `notesPerBeat` (1 o 2), BPM.

Forma standard dell'esercizio (unica forma nell'MVP):

- per ogni posizione: pattern sulla 6ª corda (mi basso), poi 5ª … fino
  alla 1ª (mi cantino) e ritorno fino alla 6ª;
- posizioni dalla 1 fino a `maxFret` **e ritorno** fino alla 1;
- dito `n` → tasto `posizione + n − 1`; accordatura standard EADGBE, da
  cui l'altezza reale di ogni nota;
- una o due note per beat secondo `notesPerBeat`; il metronomo clicca
  sempre sul beat.

Tutto il resto consuma questa lista: l'audio la suona, la UI la
evidenzia, la pausa memorizza l'indice corrente, la **ripresa salta al
primo evento della posizione corrente** (6ª corda) — una ricerca nella
lista, non logica nuova.

## Audio (client)

Web Audio API nuda, nessuna dipendenza (vincolo Lakebed; a questo scopo
è comunque la scelta giusta — Tone.js porterebbe ~150 KB per
risparmiare ~100 righe ben documentate).

- **Suoni sintetizzati:** click = impulso breve; nota = oscillatore con
  inviluppo rapido, intonato su corda+tasto.
- **Scheduling con lookahead:** timer ordinario (~25 ms) che programma
  gli eventi imminenti (~100 ms di anticipo) sull'orologio audio,
  preciso al campione. Evita derive e inceppamenti.
- **Sync UI:** lo scheduler annota "evento N all'istante T"; la UI
  confronta l'orologio audio a ogni frame ed evidenzia l'evento il cui
  istante è arrivato. Unica fonte di verità.
- **Count-in:** una battuta di soli click all'avvio e a ogni ripresa
  dopo pausa.
- Vincolo browser: l'audio parte solo dopo un gesto utente — il pulsante
  Start assolve anche a questo. Prova su iOS Safari appena c'è audio.

## UI (client, Preact)

Quattro schermate, flusso lineare:

1. **Setup:** pattern proposto a caso (rifiutabile, se ne chiede un
   altro), regolazione BPM, note per beat, tasto massimo → Start.
2. **Esercizio:** tastiera SVG a tutto schermo — 6 corde, finestra di
   **6 tasti** centrata sulla posizione corrente, nota corrente
   evidenziata con il numero del dito. Intorno: pattern, BPM, posizione,
   e due comandi grandi: **Pausa/Riprendi** e **Stop**.
3. **Feedback:** cinque pulsanti 1–5 → salvataggio → ritorno al setup
   con nuovo pattern proposto.
4. **Storico/Profilo:** lista esecuzioni + aggregazione per dito
   calcolata al volo (pesata sul BPM e sulle note per beat).

La schermata esercizio è una macchina a stati esplicita
(`setup → count-in → playing → paused → finished → feedback`) che
comanda sia audio sia tastiera: mai stati incoerenti tra i due.

Layout touch-first, telefono verticale come caso base; tablet e desktop
allargano senza cambiare struttura.

## Test e gestione errori

- **Sequencer:** test unitari (traversata completa, confini di corda,
  ritorno dal tasto massimo, punto di ripresa, mappa dito→tasto→nota,
  tempi a 1 e 2 note per beat). Runner normale in locale, fuori dal
  runtime Lakebed — da verificare al primo setup che i tool di sviluppo
  locali non siano vincolati dal limite sugli import.
- **Server:** inserimento e lettura filtrata; ispezione manuale via CLI
  Lakebed.
- **Audio/sync:** checklist manuale a orecchio — niente deriva su minuti
  di esecuzione, count-in corretto, ripresa dal punto giusto. Test iOS
  Safari precoce.
- **Errori — caso unico rilevante:** salvataggio del feedback fallito
  (offline). Il run resta in memoria, il salvataggio si ritenta, l'app
  lo segnala senza perdere l'esecuzione.

## Fuori scope MVP

- Ascolto via microfono e valutazione automatica.
- Suggerimento adattivo: l'MVP raccoglie i dati e mostra il profilo;
  l'algoritmo di selezione pesata viene dopo.
- UI di login / multi-utente visibile (il modello dati è già pronto).
- Forme di esecuzione alternative alla traversata standard.
- Suono realistico di chitarra, suddivisioni oltre 2 note per beat.
