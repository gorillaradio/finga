# Finga - Guitar Pattern Trainer - MVP Overview

## Obiettivo

Creare una piccola applicazione per l'allenamento tecnico sulla chitarra basato su **pattern di diteggiatura**.

L'app non cerca, almeno nell'MVP, di ascoltare o valutare automaticamente ciò che viene suonato. Il suo scopo è:

1. proporre esercizi;
2. fornire il metronomo;
3. raccogliere il feedback del chitarrista;
4. costruire progressivamente un profilo delle sue difficoltà;
5. usare questi dati per proporre esercizi sempre più mirati.

------

## 1. Pattern

Un pattern è una sequenza di dita, rappresentate con:

- `1` — indice
- `2` — medio
- `3` — anulare
- `4` — mignolo

Esempi:

```
1-2-3-4
2-1-3-4
1-2-1-3-1-4
3-2-4-2-1-2
```

Il pattern viene ripetuto passando da una corda alla successiva.

L'app può selezionare casualmente alcuni pattern per creare una breve sessione di esercizio.

------

## 2. Metronomo

Ogni pattern viene eseguito a un determinato **BPM**.

L'utente può scegliere la velocità iniziale e utilizzare il metronomo integrato durante l'esecuzione.

Il BPM fa parte dei dati dell'esercizio: eseguire correttamente un pattern a 60 BPM e a 120 BPM rappresenta infatti due livelli di difficoltà molto diversi.

------

## 3. Feedback

Al termine dell'esecuzione di un pattern, l'utente assegna un feedback, ad esempio su una scala:

**1 → 5**

dove un valore basso indica difficoltà e un valore alto indica un'esecuzione percepita come comoda e controllata.

Una singola osservazione può quindi essere rappresentata come:

```text
Pattern: 3-2-4-2-1-2
BPM: 90
Feedback: 3/5
```

Nel tempo l'app accumula uno storico delle esecuzioni.

------

## 4. Caratteristiche del pattern

L'ipotesi iniziale è che ogni pattern possa essere associato maggiormente a determinate dita.

Due caratteristiche sembrano particolarmente importanti.

### Dito iniziale

Il dito con cui inizia il pattern ha un'importanza particolare perché, ripetendo il pattern sulle varie corde, tende a essere anche il dito che **guida il cambio di corda**.

Esempio:

```
2-1-3-4
```

Il medio (`2`) ha quindi un ruolo particolare.

### Frequenza delle dita

Conta anche quante volte ciascun dito compare nel pattern.

Esempio:

```
3-2-4-2-1-2
```

Frequenze:

```text
1 → 1
2 → 3
3 → 1
4 → 1
```

Sebbene il pattern inizi con `3`, il dito `2` ha una presenza nettamente maggiore.

------

## 5. Pattern Finger Profile

Ogni pattern può quindi avere un **profilo** che stima quanto coinvolge ciascun dito.

Il profilo deriva almeno da:

- frequenza del dito nel pattern;
- bonus/peso associato al dito iniziale.

I pesi esatti non devono necessariamente essere definitivi nell'MVP: possono inizialmente essere euristici e venire raffinati in seguito.

Esempio concettuale:

```text
Pattern: 3-2-4-2-1-2

Indice:   basso
Medio:    alto
Anulare:  medio
Mignolo:  basso/medio
```

L'obiettivo non è affermare che un pattern alleni **esclusivamente** un dito, ma stimare quali dita siano maggiormente sollecitate.

------

## 6. Profilo dell'utente

Combinando:

- pattern eseguito;
- caratteristiche del pattern;
- BPM;
- feedback;

l'app può iniziare a costruire un profilo dell'utente.

Se, per esempio, l'utente assegna sistematicamente feedback peggiori ai pattern fortemente associati al dito `2`, il sistema può inferire che il medio rappresenti una possibile area di miglioramento.

Il BPM deve essere considerato nel calcolo: una difficoltà a 120 BPM non deve avere lo stesso significato di una difficoltà a 60 BPM.

------

## 7. Suggerimento adattivo

Con l'accumularsi delle sessioni, la selezione dei pattern può passare da puramente casuale a **adattiva**.

Invece di:

> scegli un pattern random

il sistema può arrivare a:

> scegli un pattern che abbia una probabilità maggiore di lavorare sulle aree in cui questo utente mostra maggiori difficoltà.

La componente casuale può comunque rimanere, per evitare esercizi eccessivamente ripetitivi.

------

## MVP

La prima versione può essere volutamente molto semplice.

**Flusso principale:**

```
Selezione pattern → BPM → Metronomo → Esecuzione → Feedback → Salvataggio
```

Dati minimi da salvare per ogni esecuzione:

```text
pattern
bpm
feedback
timestamp
```

Per ogni pattern:

```text
sequence
finger_frequency
starting_finger
finger_profile
```

Da questi dati sarà successivamente possibile costruire il sistema di raccomandazione.

------

## Principio guida

L'MVP non deve cercare immediatamente di capire tramite microfono se il chitarrista sta suonando correttamente.

La prima fonte di informazione è **l'autovalutazione dell'utente**.

L'idea centrale è trasformare una semplice raccolta di esercizi cromatici con metronomo in un sistema che, sessione dopo sessione, **impara quali configurazioni risultano più difficili per quel chitarrista e adatta gli esercizi di conseguenza**.