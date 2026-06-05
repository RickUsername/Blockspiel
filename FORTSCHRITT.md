# Fortschritt — 3 neue Senioren-Spiele

Stand: 5. Juni 2026 · vollautonom umgesetzt (ohne Rückfragen)

## ✅ Was fertig ist

Drei neue, seniorenfreundliche Spiele wurden komplett gebaut, in den Game Hub
eingebunden und offline-fähig gemacht. Alle drei laufen rein über **Antippen**
(kein Ziehen), im gleichen Holz-/Filz-Stil wie das Blockspiel, mit großen
Knöpfen, hohem Kontrast und **ohne Zeitdruck**.

| Spiel | Datei | Eingabe | Besonderheiten |
|---|---|---|---|
| **Paare finden** (Memory) | `memory.html` | nur Tippen | 3 Größen (6/8/10 Paare), Bestzeit, Ton |
| **Mahjong Solitaire** | `mahjong.html` | nur Tippen | garantiert lösbar, Zurück/Hinweis/Mischen, 3 Größen |
| **Solitär** (Klondike) | `solitaer.html` | Tippen (Auto-Zug) | 1 Karte ziehen, Ablegen-Knopf, Zurück/Hinweis |

### Integration
- `index.html` (Game Hub): drei neue Karten ergänzt (eigene Farben/Symbole).
- `service-worker.js`: neue Dateien im Cache, Version auf `gamehub-v2` erhöht
  (sorgt dafür, dass alte Caches beim nächsten Laden ersetzt werden).
- `GAMEDESIGN.md`: Spec für alle drei Spiele ergänzt.

### Qualitätssicherung (automatisch geprüft)
- **JavaScript-Syntax** aller drei Dateien fehlerfrei (Node-Compile-Check).
- **Mahjong-Lösbarkeit**: 6000 Test-Boards (alle Größen) erzeugt → **0 Fehler**,
  jedes Board durch Nachspielen als lösbar bestätigt. Die Spieler:innen können
  dank Zurück + Mischen nie dauerhaft festsitzen.

## 🔧 Wichtige Entscheidungen (selbst getroffen)
1. **Einzeldateien** statt geteilter CSS/JS — jedes Spiel ist eigenständig und
   robust (kein gegenseitiges Kaputtmachen). Stil ist im `<style>` jeder Datei.
2. **Memory & Mahjong nur Tippen** — leichter als das Blockspiel.
3. **Solitär bewusst entschärft**: Antippen statt Ziehen, nur 1 Karte ziehen,
   automatisches Aufdecken, „Ablegen"-Automatik. Damit liegt es deutlich näher
   am Blockspiel-Niveau als an der Schwierigkeit des Golfspiels.
4. **Töne selbst erzeugt** (WebAudio) — keine Sound-Dateien nötig, nichts zu
   herunterladen, funktioniert offline.
5. **Bilder = Emojis** — keine externen Bild-Dateien, überall sofort scharf.

## 📋 Was Du noch tun solltest (manuell)
1. **Auf echtem Gerät testen** — am besten auf dem Tablet/Handy der Senioren:
   - Lokal: im Projektordner `python -m http.server 8000` starten, dann im
     Browser `http://localhost:8000` öffnen (oder die Dateien direkt öffnen).
   - Prüfen: Sind Karten/Steine groß genug? Treffen die Finger gut?
2. **Deployen** wie bisher (gleicher Weg wie für Blockspiel). Durch
   `gamehub-v2` holt sich die installierte PWA die neuen Spiele automatisch.
3. **Solitär gegentesten** — ein paar Runden spielen und schauen, ob die
   Tipp-Automatik sich gut anfühlt. Falls es für die Senioren noch zu komplex
   ist, können wir es leicht aus dem Hub nehmen (wie beim Golfspiel) und nur
   Memory + Mahjong anbieten.
4. **Optional, falls gewünscht** (sag einfach Bescheid):
   - Memory mit **eigenen Fotos** statt Emojis (Familie, Haustiere) — sehr
     beliebt bei Senioren.
   - Natur-Deko-Ranken wie im Blockspiel auch in den neuen Spielen.
   - Sichtbarer Timer / Highscore-Liste mit Namen.

## ▶️ Schnell ausprobieren
Im Game Hub (`index.html`) auf die neuen Karten tippen, oder direkt:
`memory.html`, `mahjong.html`, `solitaer.html`.
