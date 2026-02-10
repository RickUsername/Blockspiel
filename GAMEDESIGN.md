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
