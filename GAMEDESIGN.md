# Blockspiel -- Game Design Document

## Überblick
Block-Puzzle auf einem 10x10 Raster in Holzoptik. Werbefreies, seniorenfreundliches Browsergame als PWA.

---

## Spielfeld
- **10x10 Raster** mit Holztextur
- Jede Zelle hat ein sichtbares Raster-Muster (Holzmaserung, leichte Ränder)
- Belegte Zellen haben eine hellere Holzfarbe/andere Textur

## Block-Formen
- Formen bestehen aus **1 bis 9 Zellen**, maximal **3x3 Bounding-Box**
- Formen können **nicht gedreht** werden
- Beispiele: Einzelblock, 2er-Linie, 3er-Linie, L-Form, T-Form, 2x2, 3x3, Z-Form, etc.
- **Verteilung**: Gaußsche Normalverteilung mit Tendenz zu mittelschweren Formen (3-5 Zellen häufiger, 1er und 9er seltener)

## Block-Warteschlange
- **3 sichtbare Blöcke**: Der vorderste MUSS platziert werden
- Die anderen 2 sind Vorschau
- Nach Platzierung rutscht alles eins weiter, ein neuer Block erscheint hinten
- Blöcke werden per **Drag & Drop** aus der Warteschlange ins Spielfeld gezogen

## Platzierung
- **Snapping mit Toleranzbereich**: Der Block rastet in die nächstliegende gültige Position ein
- Wenn keine gültige Position in der Nähe: Block gleitet zurück zum Ursprung
- Block muss **vollständig** ins Raster passen und darf **keine belegten Zellen** überdecken

## Linien-Clearing
- Wenn eine **Zeile oder Spalte** komplett gefüllt ist, verschwindet sie
- **Mehrere gleichzeitig** möglich
- Punkte für verschwundene Blöcke:
  - Nur Zeilen ODER nur Spalten: **1 Punkt pro verschwundene Zelle**
  - Zeilen UND Spalten gleichzeitig: verschwundene Zellen **x2**

## Reserve-Box
- **Freigeschaltet nach 200 platzierten Zellen** (Block-Zähler)
- Speichert **einen** Block für später
- **Tausch möglich**: Aktueller Pflicht-Block geht in Reserve, Reserve-Block wird zum Pflicht-Block
- Wenn Reserve leer: Block wird nur reingelegt, nächster Pflicht-Block kommt aus der Warteschlange
- Nach Tausch: Der aus der Reserve geholte Block muss platziert werden (Warteschlange rutscht NICHT weiter)

## Scoring

### Basispunkte
- Jede **platzierte Zelle** = 1 Punkt
- L-Block mit 4 Zellen = 4 Punkte

### Linien-Bonus
- Verschwundene Zellen = je 1 Punkt
- Bei gleichzeitigem Zeilen- UND Spalten-Clear: verschwundene Zellen x2

### Zeitmultiplikator (ab 100 platzierten Zellen aktiv)
- Pro Form wird die Platzierungszeit gemessen
- < 5 Sekunden: x1.5
- 5-15 Sekunden: x1.2
- 15-30 Sekunden: x1.0
- > 30 Sekunden: x1.0 (kein Abzug)
- Multiplikator gilt nur auf die Basispunkte der platzierten Form (nicht auf Linien-Bonus)

### Block-Zähler
- Zählt die **Gesamtanzahl platzierter Zellen** (nicht Formen)
- Wird im UI angezeigt
- Dient als Fortschritt (200 = Reserve freischalten)

## Game Over
- Tritt ein wenn der aktuelle Pflicht-Block **nirgendwo** mehr platziert werden kann
- Highscore-Anzeige mit Namenseingabe
- Name wird lokal gespeichert (localStorage) und beim nächsten Mal vorausgefüllt

## Highscore
- Lokal im Browser (localStorage)
- Top 10 Liste mit Name + Punktzahl
- Sortiert nach Punktzahl absteigend

## Sounds
| Ereignis | Beschreibung |
|---|---|
| Block aufnehmen | Leichtes Holz-Klick |
| Block platzieren | Sattes Holz-Aufsetzen |
| Block zurück (ungültig) | Leises Zurückgleiten |
| Linie verschwindet | Befriedigendes Holz-Gleiten |
| Mehrere Linien | Stärkerer Combo-Sound |
| Game Over | Sanfter Ton (nicht frustrierend) |
| Neuer Highscore | Kurze freundliche Fanfare |

## UI-Elemente
- **Spielfeld** (10x10 Raster, zentral)
- **Block-Warteschlange** (3 Blöcke, unterhalb des Feldes)
- **Reserve-Box** (neben Warteschlange, ausgegraut bis freigeschaltet)
- **Block-Zähler** (oben, große Schrift)
- **Punktestand** (oben, große Schrift)
- **Lautstärke-Button** (Lautsprecher-Symbol, wird rot wenn stumm)
- **Kein Tutorial** -- Spiel startet direkt

## Senioren-Design
- **Große Schrift** standardmäßig, keine Einstellungsmöglichkeit
- **Große Touch-Ziele** (min. 56-64px)
- **Klare Kontraste** (Holztöne, gut unterscheidbare Farben)
- **Keine Ablenkungen** (keine Werbung, keine Pop-ups, keine Animationen die verwirren)
- **Einfache Navigation** (kein Menü, alles auf einem Screen)

## Technik
- Vanilla HTML/CSS/JavaScript (kein Framework)
- Canvas oder DOM-basiert (DOM bevorzugt für Accessibility)
- PWA mit Service Worker (offline-fähig, installierbar)
- localStorage für Highscores und Spielernamen
- Responsive: Handy (portrait), Tablet, Desktop

---
---

# Paare finden (Memory) — `memory.html`

## Überblick
Klassisches Memory zum **Antippen** (kein Ziehen). Noch einfacher als das Blockspiel — ideal als sanfter Einstieg.

## Ablauf
- Karten liegen verdeckt (Holzrückseite mit Fragezeichen).
- Antippen dreht eine Karte um. Zwei gleiche Motive bleiben offen (grüner Rahmen).
- Zwei verschiedene drehen sich nach kurzem Anzeigen wieder zurück (kein Zeitdruck).
- Spiel gewonnen, wenn alle Paare gefunden sind.

## Schwierigkeit (große Knöpfe oben)
- **Leicht**: 6 Paare (12 Karten, 4×3)
- **Mittel**: 8 Paare (16 Karten, 4×4)
- **Schwer**: 10 Paare (20 Karten, 5×4)

## Details
- Motive: große, klare Emojis (Tiere, Blumen, Obst).
- Anzeige: Züge-Zähler. Intern wird die Zeit gemessen → **Bestzeit je Schwierigkeit** (localStorage).
- Ton per WebAudio (Aufdecken, Treffer, Fehlversuch, Sieg). Ein/Aus-Knopf.

---

# Mahjong Solitaire — `mahjong.html`

## Überblick
Gleiche Steine paarweise **antippen und wegräumen**. Sehr beliebt bei Senioren.

## Regeln
- Ein Stein ist **spielbar (frei)**, wenn oben nichts darauf liegt UND links ODER rechts frei ist. Nicht-freie Steine sind leicht abgedunkelt.
- Zwei freie Steine mit gleichem Motiv tippen → beide verschwinden.
- Gewonnen, wenn alle Steine weg sind.

## Senioren-Hilfen (nie festsitzen!)
- **Garantiert lösbares Layout** — durch Rückwärts-Erzeugung (immer paarweise frei). Mit 6000 Test-Boards verifiziert: 0 Fehler.
- **Zurück** (beliebig oft), **Hinweis** (zeigt ein mögliches Paar), **Mischen** (verteilt die übrigen Steine neu, garantiert mind. einen Zug).
- Schwierigkeit: **Leicht** (22 Steine), **Mittel** (48), **Schwer** (68).
- Bestzeit je Schwierigkeit, Ton per WebAudio.

---

# Solitär / Patience (Klondike) — `solitaer.html`

## Überblick
Klassische Patience — bewusst **so einfach wie möglich** gemacht.

## Senioren-Anpassungen
- **Antippen statt Ziehen**: Eine Karte antippen → sie wandert automatisch an den besten gültigen Platz (zuerst aufs Ass-Fundament, sonst auf eine passende Spalte).
- **1 Karte ziehen** (nicht 3) vom Stapel — deutlich leichter.
- **Automatisches Aufdecken** freigelegter Karten.
- **„Ablegen"-Knopf**: legt automatisch alle möglichen Karten auf die Fundamente.
- **Zurück** (beliebig oft) und **Hinweis** (zeigt eine sinnvolle Karte).
- Leere Spalten nehmen Könige, Fundamente werden A→K nach Farbe gebaut.

## Hinweis
Klondike-Mischungen sind nicht immer zu 100 % lösbar; durch unbegrenztes Zurücklegen des Stapels, Zurück und Hinweis bleibt es aber stets handhabbar. „Neu" mischt jederzeit neu. Bestzeit in localStorage.

---

# Früchte (Match-3 "Zen") -- fruechte.html

## Konzept
Entspanntes Drei-gewinnt im Stil von Candy Crush, aber bewusst ohne jeden Druck:
**kein Zeitlimit, keine begrenzten Züge, kein Verlieren.** Für sehr alte Nutzer.

## Spielfeld
- **6 Spalten x 8 Zeilen** (48 Kacheln). 6 breit = große, gut treffbare Felder
  (das Tablet wird hochkant gehalten -> Breite ist das Nadelöhr).
- Fit-Funktion skaliert das Brett so, dass alle 8 Zeilen + Header auf den Schirm passen.

## Früchte / Farben (Form UND Farbe doppelt kodiert -> seniorenfreundlich)
0 🍎 rot, 1 🍌 gelb, 2 🍇 lila, 3 🍏 grün, 4 🍊 orange, 5 🫐 blau.
Reihenfolge so gewählt, dass jede Schwierigkeit maximal unterscheidbare Farben nutzt.

## Ziel & Punkte (keine Schwierigkeitsstufen)
- Feste **5 Fruchtsorten**, ein einziges Ziel: **200 Punkte**.
- Punkte: 1 pro Frucht, **Extra-Bonus ab 4 gleichen**:
  3er = 3, 4er = 9, 5er = 15, 6er = 21 Punkte (`runScore(L) = L + (L>3 ? (L-3)*5 : 0)`).
- Stufen entfernt (brachten kaum spürbaren Unterschied).
- Validiert: 6000 Simulationen, Ziel immer erreichbar, Median ~41 Züge, 94 % mit 4+-Bonus.

## Steuerung (nur Tippen, kein Drag)
- Erstes Feld antippen -> hervorgehoben.
- Benachbartes Feld antippen -> Tausch.
- Tausch ohne Treffer wird sanft rückgängig gemacht (kleines Wackeln).
- Nicht benachbart angetippt -> Auswahl springt einfach dorthin (verzeihend).

## Spiellogik
- 3+ gleiche waagrecht/senkrecht verschwinden, Früchte rutschen nach, oben kommen neue.
- Kettenreaktionen werden automatisch aufgelöst (Bonus-Früchte).
- Brettgenerierung ohne Start-Treffer und garantiert mit mindestens einem Zug.
- **Anti-Sackgasse:** Gibt es keinen Zug mehr, mischt das Brett automatisch neu
  (validiert: 12.000 Simulationen, 0 Hänger, Ziel immer erreichbar).
- Fortschrittsbalken zeigt Punkte / 200.
- Bei Ziel erreicht: "Geschafft!" + Bestzeit (localStorage `fruchtBest`).

## Technik
- Reines HTML/CSS/JS, im PWA-Cache (service-worker `gamehub-v3`).
- Leichte Animationen (nur transform/opacity), kein blur -> läuft auf schwacher Hardware.
- WebAudio-Sounds (Tausch/Treffer/Sieg), Stummschalter (`fruchtMuted`).

---

# Belagerte Burg (Beleaguered Castle) — `burg.html`

## Überblick
Offene Patience: alle Karten liegen aufgedeckt. Die 4 Asse liegen von Beginn an
in der Mitte (Fundamente) und werden farbweise bis zum König hochgebaut.

## Tableau
- 4 **Fundamente** oben in der Mitte (je ein Ass vorgelegt).
- **8 Reihen ("Flügel")** mit je 6 offenen Karten (4×12 = 48 Karten passen exakt,
  da die 4 Asse schon liegen).
- Reihen liegen waagrecht; spielbar ist die jeweils äußere (oberste) Karte.
  Karten rücken bei langen Reihen automatisch enger zusammen (passt sich an die
  Bildschirmbreite an), die oberste Karte bleibt immer voll sichtbar.

## Regeln (bewusst großzügig für Senioren)
- **Fundament:** aufsteigend A→K, **gleiche Farbe/Symbol**.
- **Reihen stapeln:** absteigend um genau 1, **Farbe egal** (rot auf rot, schwarz
  auf rot, … — ausdrücklich gewünscht).
- **Ganze Folgen verschiebbar:** tippt man eine Karte an, wandert sie samt der
  lückenlos absteigenden Folge darunter mit.
- **Leere Reihe** nimmt jede beliebige Karte (bzw. Folge).
- Kein Nachziehstapel, alles offen.

## Steuerung (nur Tippen)
- Karte antippen → bestes Ziel automatisch: einzelne Spitze zuerst aufs Fundament,
  sonst auf eine passende Reihe (belegt bevorzugt, sonst leer).
- Fundament-Spitze antippen → zurück in eine passende Reihe (z. B. zum Umsortieren).

## Senioren-Hilfen (nie festsitzen)
- **Zurück** (beliebig oft), **Hinweis** (zeigt einen sinnvollen Zug),
  **Ablegen** (legt automatisch alle möglichen Karten aufs Fundament), **Neu**.
- Kein Zeitdruck, kein Verlieren. Sitzt man fest: Zurück oder Neu.
- Bestzeit in localStorage (`burgBest`), Stummschalter (`burgMuted`).
- Hinweis: Beleaguered Castle ist nicht jede Mischung lösbar; durch Farb-egal-Stapeln,
  Folgen-Züge, unbegrenztes Zurück und „Neu" bleibt es aber stets handhabbar.

## Technik
- Reines HTML/CSS/JS, im PWA-Cache (service-worker `gamehub-v6`).
- Leichte Animationen (nur transform/opacity), kein blur.
- 8 Reihen symmetrisch; Kartenmaße aus Höhe (9 Reihen) berechnet, Reihenversatz
  passt sich der Breite an.
