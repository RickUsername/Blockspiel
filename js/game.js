/**
 * Blockspiel — Block-Puzzle im Holzdesign
 * Reines HTML/CSS/JS, keine Frameworks
 */

// ============================================================
// Konstanten
// ============================================================
const GRID_SIZE = 10;
const CELLS_FOR_TIMER = 100;    // Ab 100 platzierten Zellen: Tempo-Multiplikator aktiv
const CELLS_FOR_RESERVE = 200;  // Ab 200 platzierten Zellen: Reserve-Box aktiv
// Holzarten-Palette (Basis, Maserung-dunkel, Maserung-hell)
const WOOD_TYPES = [
  { base: '#D4A45A', dark: '#B8873A', light: '#E8C88A', name: 'Ahorn' },
  { base: '#A0582D', dark: '#7B3F18', light: '#C47A4E', name: 'Kirsche' },
  { base: '#7A5230', dark: '#5C3A1E', light: '#9E7650', name: 'Nussbaum' },
  { base: '#C49040', dark: '#A07028', light: '#DEB060', name: 'Eiche' },
  { base: '#8B4C28', dark: '#6A3418', light: '#B0704A', name: 'Mahagoni' },
  { base: '#CCAD82', dark: '#B09468', light: '#E8D4B0', name: 'Birke' },
  { base: '#B07038', dark: '#8A5020', light: '#D09458', name: 'Teak' },
];
const COLORS = WOOD_TYPES.map(w => w.base);

// Alle verfügbaren Block-Formen mit Größenkategorie (1=klein, 2=mittel, 3=groß)
const SHAPES = [
  // --- Klein (Kategorie 1) ---
  { cells: [[0,0]], name: '1x1', size: 1 },
  { cells: [[0,0],[1,0]], name: '1x2', size: 1 },
  { cells: [[0,0],[0,1]], name: '2x1', size: 1 },
  // --- Mittel (Kategorie 2) ---
  { cells: [[0,0],[1,0],[2,0]], name: '1x3', size: 2 },
  { cells: [[0,0],[0,1],[0,2]], name: '3x1', size: 2 },
  { cells: [[0,0],[1,0],[0,1],[1,1]], name: '2x2', size: 2 },
  { cells: [[0,0],[0,1],[1,1]], name: 'L1', size: 2 },
  { cells: [[0,0],[1,0],[0,1]], name: 'L2', size: 2 },
  { cells: [[0,0],[1,0],[1,1]], name: 'L3', size: 2 },
  { cells: [[0,0],[1,1],[0,1]], name: 'L4', size: 2 },
  { cells: [[0,0],[1,0],[2,0],[3,0]], name: '1x4', size: 2 },
  { cells: [[0,0],[0,1],[0,2],[0,3]], name: '4x1', size: 2 },
  { cells: [[0,0],[0,1],[0,2],[1,2]], name: 'bigL1', size: 2 },
  { cells: [[0,0],[1,0],[2,0],[0,1]], name: 'bigL2', size: 2 },
  { cells: [[0,0],[1,0],[1,1],[1,2]], name: 'bigL3', size: 2 },
  { cells: [[0,0],[1,0],[2,0],[2,1]], name: 'bigL4', size: 2 },
  { cells: [[0,0],[1,0],[2,0],[1,1]], name: 'T1', size: 2 },
  { cells: [[1,0],[2,0],[0,1],[1,1]], name: 'S1', size: 2 },
  { cells: [[0,0],[1,0],[1,1],[2,1]], name: 'Z1', size: 2 },
  // --- Groß (Kategorie 3) ---
  { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], name: '1x5', size: 3 },
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], name: '5x1', size: 3 },
  { cells: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], name: '3x3', size: 3 },
];

// Gaußsche Gewichtung: mittelgroße Formen am häufigsten
const SIZE_WEIGHTS = { 1: 1, 2: 3, 3: 1 };

// ============================================================
// Spielzustand
// ============================================================
let grid = [];
let score = 0;
let highscore = 0;
let currentPieces = [];
let gameOver = false;
let totalBlocksPlaced = 0;   // Zählt einzelne Zellen, nicht Formen

// Reserve-Box
let reservePiece = null;
let reserveUnlocked = false;

// Tempo-Multiplikator (Pro-Form-Timer)
let formStartTime = 0;
let timeMultiplierActive = false;
let tempoInterval = null;

// Drag-State
let dragPiece = null;
let dragOffset = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let isDragging = false;
let hoverCells = [];

// DOM-Referenzen
let boardEl, previewEl, scoreEl, highscoreEl, gameOverEl, finalScoreEl;
let canvasBoard, ctx, cellSize = 0;
let reserveEl, tempoEl;

// ============================================================
// Gaußsche Formauswahl
// ============================================================
function pickRandomShape() {
  const weighted = [];
  for (const shape of SHAPES) {
    const w = SIZE_WEIGHTS[shape.size] || 1;
    for (let i = 0; i < w; i++) weighted.push(shape);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// ============================================================
// Initialisierung
// ============================================================
function init() {
  highscore = parseInt(localStorage.getItem('blockspiel-highscore') || '0', 10);
  buildDOM();
  newGame();
  resizeBoard();
  window.addEventListener('resize', resizeBoard);
}

function buildDOM() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header id="header">
      <h1>Blockspiel</h1>
      <div id="score-area">
        <div class="score-box">
          <span class="score-label">Punkte</span>
          <span id="score">0</span>
        </div>
        <div class="score-box">
          <span class="score-label">Rekord</span>
          <span id="highscore">0</span>
        </div>
        <div class="score-box tempo-box hidden" id="tempo-box">
          <span class="score-label">Tempo</span>
          <span id="tempo">x1.0</span>
        </div>
      </div>
    </header>
    <div id="board-wrap">
      <canvas id="board"></canvas>
    </div>
    <div id="preview-row">
      <div id="preview"></div>
      <div id="reserve" class="locked" title="Reserve-Box: Block zwischenspeichern">
        <span class="reserve-label">Reserve</span>
        <canvas id="reserve-canvas" width="0" height="0"></canvas>
      </div>
    </div>
    <div id="block-counter"></div>
    <div id="game-over" class="hidden">
      <div id="game-over-box">
        <h2>Spiel vorbei</h2>
        <p>Punkte: <span id="final-score">0</span></p>
        <button id="restart-btn">Neues Spiel</button>
      </div>
    </div>
  `;

  boardEl = document.getElementById('board-wrap');
  canvasBoard = document.getElementById('board');
  ctx = canvasBoard.getContext('2d');
  previewEl = document.getElementById('preview');
  scoreEl = document.getElementById('score');
  highscoreEl = document.getElementById('highscore');
  gameOverEl = document.getElementById('game-over');
  finalScoreEl = document.getElementById('final-score');
  reserveEl = document.getElementById('reserve');
  tempoEl = document.getElementById('tempo');

  document.getElementById('restart-btn').addEventListener('click', newGame);

  // Reserve-Box: Klick/Tap zum Tauschen
  reserveEl.addEventListener('click', onReserveSwap);

  // Drag-Events (Mouse + Touch)
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
}

function resizeBoard() {
  const header = document.getElementById('header');
  const headerH = header ? header.offsetHeight : 80;
  const previewH = 130;
  const padding = 40;
  const availH = window.innerHeight - headerH - previewH - padding;
  const availW = window.innerWidth - padding;
  const maxBoardPx = Math.min(availH, availW, 500);
  cellSize = Math.floor(maxBoardPx / GRID_SIZE);
  const boardPx = cellSize * GRID_SIZE;

  canvasBoard.width = boardPx;
  canvasBoard.height = boardPx;
  canvasBoard.style.width = boardPx + 'px';
  canvasBoard.style.height = boardPx + 'px';

  woodCache = null; // Holztextur neu generieren bei Größenänderung
  drawBoard();
  renderPreview();
  renderReserve();
}

// ============================================================
// Neues Spiel
// ============================================================
function newGame() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  score = 0;
  totalBlocksPlaced = 0;
  reservePiece = null;
  reserveUnlocked = false;
  timeMultiplierActive = false;
  formStartTime = 0;
  gameOver = false;
  if (tempoInterval) clearInterval(tempoInterval);
  tempoInterval = null;
  gameOverEl.classList.add('hidden');
  document.getElementById('tempo-box').classList.add('hidden');
  reserveEl.classList.add('locked');
  reserveEl.classList.remove('empty');
  updateScore();
  updateBlockCounter();
  spawnPieces();
  drawBoard();
  renderReserve();
}

// ============================================================
// Stücke generieren (nur beim Spielstart)
// ============================================================
function spawnPieces() {
  currentPieces = [];
  for (let i = 0; i < 3; i++) {
    const shape = pickRandomShape();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    currentPieces.push({ shape, color });
  }
  formStartTime = Date.now();
  renderPreview();
}

// ============================================================
// Queue-Verwaltung (FIFO)
// ============================================================
function shiftQueue() {
  currentPieces.shift();
  const shape = pickRandomShape();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  currentPieces.push({ shape, color });
  formStartTime = Date.now();
  renderPreview();
}

// ============================================================
// Vorschau rendern (FIFO: nur Index 0 ist ziehbar)
// ============================================================
function renderPreview() {
  previewEl.innerHTML = '';
  currentPieces.forEach((piece, idx) => {
    const slot = document.createElement('div');
    slot.className = 'preview-slot';

    if (idx === 0) {
      slot.classList.add('mandatory');
    } else {
      slot.classList.add('preview-only');
    }

    const { shape, color } = piece;
    let maxC = 0, maxR = 0;
    shape.cells.forEach(([c, r]) => {
      if (c > maxC) maxC = c;
      if (r > maxR) maxR = r;
    });
    const cols = maxC + 1;
    const rows = maxR + 1;
    const previewCellSize = Math.min(28, Math.floor(80 / Math.max(cols, rows)));

    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = cols * previewCellSize;
    miniCanvas.height = rows * previewCellSize;
    miniCanvas.className = 'preview-canvas';
    const mctx = miniCanvas.getContext('2d');

    shape.cells.forEach(([c, r]) => {
      drawBlock(mctx, c * previewCellSize, r * previewCellSize, previewCellSize, color);
    });

    slot.appendChild(miniCanvas);

    // Nur der Pflicht-Block (Index 0) ist ziehbar
    if (idx === 0) {
      const startDrag = (clientX, clientY) => {
        if (gameOver) return;
        dragPiece = { shape: piece.shape, color: piece.color, index: idx };
        isDragging = true;
        const rect = slot.getBoundingClientRect();
        dragOffset.x = clientX - rect.left;
        dragOffset.y = clientY - rect.top;
        dragPos.x = clientX;
        dragPos.y = clientY;
        slot.classList.add('dragging');
      };

      slot.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      });
      slot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);
      }, { passive: false });
    }

    previewEl.appendChild(slot);
  });
}

// ============================================================
// Reserve-Box
// ============================================================
function renderReserve() {
  const canvas = document.getElementById('reserve-canvas');
  if (!canvas) return;

  if (!reserveUnlocked) {
    reserveEl.classList.add('locked');
    reserveEl.classList.remove('empty');
    canvas.width = 0;
    canvas.height = 0;
    return;
  }

  reserveEl.classList.remove('locked');

  if (!reservePiece) {
    canvas.width = 0;
    canvas.height = 0;
    reserveEl.classList.add('empty');
    return;
  }

  reserveEl.classList.remove('empty');

  const { shape, color } = reservePiece;
  let maxC = 0, maxR = 0;
  shape.cells.forEach(([c, r]) => {
    if (c > maxC) maxC = c;
    if (r > maxR) maxR = r;
  });
  const cols = maxC + 1;
  const rows = maxR + 1;
  const rCellSize = Math.min(20, Math.floor(50 / Math.max(cols, rows)));

  canvas.width = cols * rCellSize;
  canvas.height = rows * rCellSize;
  const rctx = canvas.getContext('2d');
  rctx.clearRect(0, 0, canvas.width, canvas.height);

  shape.cells.forEach(([c, r]) => {
    drawBlock(rctx, c * rCellSize, r * rCellSize, rCellSize, color);
  });
}

function onReserveSwap() {
  if (gameOver || !reserveUnlocked || isDragging) return;
  if (currentPieces.length === 0) return;

  const mandatory = currentPieces[0];
  if (!mandatory) return;

  if (reservePiece === null) {
    // Reserve leer: Block reinlegen, Queue rückt nach
    reservePiece = mandatory;
    shiftQueue();
  } else {
    // Reserve belegt: Tausch, Queue rückt NICHT nach
    const temp = reservePiece;
    reservePiece = mandatory;
    currentPieces[0] = temp;
    formStartTime = Date.now();
    renderPreview();
  }

  renderReserve();
  checkGameOver();
}

function checkReserveUnlock() {
  if (totalBlocksPlaced >= CELLS_FOR_RESERVE && !reserveUnlocked) {
    reserveUnlocked = true;
    renderReserve();
  }
}

// ============================================================
// Tempo-Multiplikator (Pro-Form-Timer)
// ============================================================
function getTimeMultiplier() {
  if (!timeMultiplierActive) return 1.0;
  const elapsed = (Date.now() - formStartTime) / 1000;
  if (elapsed < 5) return 1.5;
  if (elapsed < 15) return 1.2;
  return 1.0;
}

function updateTempoDisplay() {
  if (!timeMultiplierActive) return;
  const mult = getTimeMultiplier();
  tempoEl.textContent = 'x' + mult.toFixed(1);
  if (mult >= 1.5) tempoEl.style.color = '#2ECC71';
  else if (mult >= 1.2) tempoEl.style.color = '#F1C40F';
  else tempoEl.style.color = '#FF6B6B';
}

function checkTempoStart() {
  if (totalBlocksPlaced >= CELLS_FOR_TIMER && !timeMultiplierActive) {
    timeMultiplierActive = true;
    document.getElementById('tempo-box').classList.remove('hidden');
    tempoInterval = setInterval(updateTempoDisplay, 100);
    updateTempoDisplay();
  }
}

// ============================================================
// Block-Zähler
// ============================================================
function updateBlockCounter() {
  const el = document.getElementById('block-counter');
  if (totalBlocksPlaced < CELLS_FOR_RESERVE) {
    el.textContent = totalBlocksPlaced + ' / ' + CELLS_FOR_RESERVE + ' Zellen';
  } else {
    el.textContent = totalBlocksPlaced + ' Zellen';
  }
}

// ============================================================
// Drag & Drop
// ============================================================
function onDragMove(e) {
  if (!isDragging) return;
  dragPos.x = e.clientX;
  dragPos.y = e.clientY;
  updateHover();
}

function onTouchMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  dragPos.x = t.clientX;
  dragPos.y = t.clientY - 60;
  updateHover();
}

function onDragEnd(e) {
  if (!isDragging) return;
  tryPlace();
  isDragging = false;
  dragPiece = null;
  hoverCells = [];
  drawBoard();
  document.querySelectorAll('.preview-slot').forEach(s => s.classList.remove('dragging'));
}

function onTouchEnd(e) {
  onDragEnd(e);
}

function updateHover() {
  if (!dragPiece) return;
  const rect = canvasBoard.getBoundingClientRect();
  const relX = dragPos.x - rect.left;
  const relY = dragPos.y - rect.top;
  const gridCol = Math.round((relX - cellSize / 2) / cellSize);
  const gridRow = Math.round((relY - cellSize / 2) / cellSize);

  hoverCells = [];
  const cells = dragPiece.shape.cells;
  let valid = true;
  for (const [c, r] of cells) {
    const col = gridCol + c;
    const row = gridRow + r;
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
      valid = false;
      break;
    }
    if (grid[row][col] !== null) {
      valid = false;
      break;
    }
    hoverCells.push({ col, row });
  }
  if (!valid) hoverCells = [];
  drawBoard();
}

function tryPlace() {
  if (hoverCells.length === 0 || !dragPiece) return;

  hoverCells.forEach(({ col, row }) => {
    grid[row][col] = dragPiece.color;
  });

  const cellCount = hoverCells.length;

  // Basispunkte mit Tempo-Multiplikator
  let basePoints = cellCount;
  if (timeMultiplierActive) {
    const mult = getTimeMultiplier();
    basePoints = Math.round(cellCount * mult);
  }
  score += basePoints;
  totalBlocksPlaced += cellCount;

  // Linien löschen (eigenes Scoring)
  clearLines();
  updateScore();
  updateBlockCounter();

  // Tempo & Reserve prüfen
  checkTempoStart();
  checkReserveUnlock();

  // Queue nachrücken
  shiftQueue();

  checkGameOver();
}

// ============================================================
// Reihen und Spalten löschen
// ============================================================
function clearLines() {
  let rowsToClear = [];
  let colsToClear = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every(cell => cell !== null)) {
      rowsToClear.push(r);
    }
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) { full = false; break; }
    }
    if (full) colsToClear.push(c);
  }

  if (rowsToClear.length === 0 && colsToClear.length === 0) return;

  // Verschwundene Zellen zählen (Überschneidungen nur 1x)
  const clearedSet = new Set();
  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID_SIZE; c++) clearedSet.add(r * GRID_SIZE + c);
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID_SIZE; r++) clearedSet.add(r * GRID_SIZE + c);
  });

  let lineScore = clearedSet.size; // 1 Punkt pro verschwundene Zelle

  // Bei Zeilen UND Spalten gleichzeitig: x2
  if (rowsToClear.length > 0 && colsToClear.length > 0) {
    lineScore *= 2;
  }

  score += lineScore;

  // Grid leeren
  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = null;
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = null;
  });

  animateClear(rowsToClear, colsToClear);
}

function animateClear(rows, cols) {
  const flash = () => {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    rows.forEach(r => {
      ctx.fillRect(0, r * cellSize, GRID_SIZE * cellSize, cellSize);
    });
    cols.forEach(c => {
      ctx.fillRect(c * cellSize, 0, cellSize, GRID_SIZE * cellSize);
    });
  };
  flash();
  setTimeout(() => drawBoard(), 150);
}

// ============================================================
// Game Over
// ============================================================
function checkGameOver() {
  if (currentPieces.length === 0) return;

  const mandatory = currentPieces[0];
  if (!mandatory) return;

  // Pflicht-Block passt? -> Kein Game Over
  if (canPlaceAnywhere(mandatory.shape)) return;

  // Reserve-Möglichkeiten prüfen
  if (reserveUnlocked) {
    if (reservePiece !== null) {
      // Reserve belegt + passt? -> Kein Game Over
      if (canPlaceAnywhere(reservePiece.shape)) return;
    } else {
      // Reserve leer + nächster Block passt? -> Kein Game Over
      if (currentPieces.length > 1 && currentPieces[1] &&
          canPlaceAnywhere(currentPieces[1].shape)) return;
    }
  }

  // Game Over (kein Zeit-Bonus mehr)
  gameOver = true;
  if (tempoInterval) clearInterval(tempoInterval);

  if (score > highscore) {
    highscore = score;
    localStorage.setItem('blockspiel-highscore', String(highscore));
  }
  updateScore();
  finalScoreEl.textContent = score;
  gameOverEl.classList.remove('hidden');
}

function canPlaceAnywhere(shape) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let fits = true;
      for (const [dc, dr] of shape.cells) {
        const col = c + dc;
        const row = r + dr;
        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE || grid[row][col] !== null) {
          fits = false;
          break;
        }
      }
      if (fits) return true;
    }
  }
  return false;
}

// ============================================================
// Zeichnen — Premium-Holzoptik
// ============================================================

// Holz-Textur einmalig als Off-Screen-Canvas cachen
let woodCache = null;
let woodCacheSize = 0;

function generateWoodTexture(size) {
  if (woodCache && woodCacheSize === size) return woodCache;
  woodCacheSize = size;
  const oc = document.createElement('canvas');
  oc.width = size;
  oc.height = size;
  const ox = oc.getContext('2d');

  // Basis: warmer Nussbaumton mit sanftem Verlauf
  const baseGrad = ox.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#9B7B55');
  baseGrad.addColorStop(0.3, '#8B6B45');
  baseGrad.addColorStop(0.6, '#7D5F3B');
  baseGrad.addColorStop(1, '#6E5232');
  ox.fillStyle = baseGrad;
  ox.fillRect(0, 0, size, size);

  // Maserung Schicht 1: breite wellige Streifen
  ox.globalAlpha = 0.07;
  for (let y = 0; y < size; y += 3) {
    ox.beginPath();
    ox.moveTo(0, y);
    for (let x = 0; x < size; x += 8) {
      const wave = Math.sin(y * 0.02 + x * 0.005) * 3
                 + Math.sin(y * 0.05) * 1.5
                 + Math.sin(x * 0.01 + y * 0.03) * 2;
      ox.lineTo(x, y + wave);
    }
    ox.strokeStyle = (y % 6 < 3) ? '#3A2010' : '#B8956A';
    ox.lineWidth = 1.5;
    ox.stroke();
  }

  // Maserung Schicht 2: feine Poren
  ox.globalAlpha = 0.04;
  ox.strokeStyle = '#2A1508';
  ox.lineWidth = 0.5;
  for (let y = 0; y < size; y += 2) {
    ox.beginPath();
    ox.moveTo(0, y + Math.sin(y * 0.08) * 1.5);
    ox.lineTo(size, y + Math.sin(y * 0.08 + 2) * 1.5);
    ox.stroke();
  }

  // Maserung Schicht 3: breite dunkle Bänder (Jahresringe-Effekt)
  ox.globalAlpha = 0.035;
  for (let y = 0; y < size; y += 18) {
    const bandWidth = 6 + Math.sin(y * 0.1) * 3;
    ox.fillStyle = '#2A1508';
    ox.beginPath();
    ox.moveTo(0, y);
    for (let x = 0; x <= size; x += 4) {
      const wave = Math.sin(y * 0.015 + x * 0.008) * 4
                 + Math.sin(x * 0.02) * 2;
      ox.lineTo(x, y + wave);
    }
    for (let x = size; x >= 0; x -= 4) {
      const wave = Math.sin(y * 0.015 + x * 0.008) * 4
                 + Math.sin(x * 0.02) * 2;
      ox.lineTo(x, y + wave + bandWidth);
    }
    ox.closePath();
    ox.fill();
  }

  // Leichter Glanzeffekt von oben links
  ox.globalAlpha = 1;
  const sheen = ox.createRadialGradient(
    size * 0.2, size * 0.15, 0,
    size * 0.2, size * 0.15, size * 0.8
  );
  sheen.addColorStop(0, 'rgba(255,240,200,0.08)');
  sheen.addColorStop(0.5, 'rgba(255,240,200,0.02)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.04)');
  ox.fillStyle = sheen;
  ox.fillRect(0, 0, size, size);

  woodCache = oc;
  return oc;
}

function drawBoard() {
  const size = cellSize * GRID_SIZE;

  // Holz-Textur zeichnen
  const wood = generateWoodTexture(size);
  ctx.drawImage(wood, 0, 0);

  // Gefräste Gitterlinien (doppelte Linie für Tiefe)
  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * cellSize;

    // Schattenlinie (dunkel, leicht versetzt)
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pos + 0.5, 0);
    ctx.lineTo(pos + 0.5, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos + 0.5);
    ctx.lineTo(size, pos + 0.5);
    ctx.stroke();

    // Lichtlinie (hell, daneben — ergibt eingefrästen Look)
    ctx.strokeStyle = 'rgba(255,220,160,0.06)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pos + 1.5, 0);
    ctx.lineTo(pos + 1.5, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos + 1.5);
    ctx.lineTo(size, pos + 1.5);
    ctx.stroke();
  }

  // Belegte Zellen
  for (let r = 0; r < GRID_SIZE; r++) {
    if (!grid[r]) continue;
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c]) {
        drawBlock(ctx, c * cellSize, r * cellSize, cellSize, grid[r][c]);
      }
    }
  }

  // Hover-Vorschau
  if (hoverCells.length > 0 && dragPiece) {
    hoverCells.forEach(({ col, row }) => {
      drawBlock(ctx, col * cellSize, row * cellSize, cellSize, dragPiece.color, 0.5);
    });
  }
}

function getWoodType(color) {
  const idx = COLORS.indexOf(color);
  return idx >= 0 ? WOOD_TYPES[idx] : { base: color, dark: darkenColor(color, 30), light: lightenColor(color, 30) };
}

function drawBlock(context, x, y, size, color, alpha = 1) {
  const pad = 2;
  const r = Math.min(4, size * 0.12);
  const bx = x + pad;
  const by = y + pad;
  const bw = size - pad * 2;
  const bh = size - pad * 2;
  const wood = getWoodType(color);

  context.globalAlpha = alpha;

  // Schatten unter dem Block
  context.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(context, bx + 1.5, by + 1.5, bw, bh, r);
  context.fill();

  // Block-Körper: Holz-Grundverlauf
  const bodyGrad = context.createLinearGradient(bx, by, bx + bw * 0.3, by + bh);
  bodyGrad.addColorStop(0, wood.light);
  bodyGrad.addColorStop(0.35, wood.base);
  bodyGrad.addColorStop(0.7, darkenColor(wood.base, 10));
  bodyGrad.addColorStop(1, wood.dark);
  context.fillStyle = bodyGrad;
  roundRect(context, bx, by, bw, bh, r);
  context.fill();

  // Holzmaserung auf dem Block
  context.save();
  roundRect(context, bx, by, bw, bh, r);
  context.clip();

  // Maserungslinien — wellige horizontale Streifen
  const seed = (x * 7 + y * 13) % 100; // Pseudo-Seed pro Position
  for (let ly = 0; ly < bh; ly += 2.5) {
    context.beginPath();
    context.moveTo(bx, by + ly);
    for (let lx = 0; lx <= bw; lx += 4) {
      const wave = Math.sin((ly + seed) * 0.15 + lx * 0.04) * 1.2
                 + Math.sin((ly + seed) * 0.08 + lx * 0.02) * 0.8;
      context.lineTo(bx + lx, by + ly + wave);
    }
    context.strokeStyle = (ly % 5 < 2.5)
      ? 'rgba(0,0,0,0.1)'
      : ('rgba(255,255,255,0.06)');
    context.lineWidth = 0.7;
    context.stroke();
  }

  // Breite Maserungsbänder (wie Jahresringe im Querschnitt)
  for (let ly = 3 + (seed % 5); ly < bh; ly += 7 + (seed % 4)) {
    context.globalAlpha = alpha * 0.06;
    context.fillStyle = wood.dark;
    const bandH = 2 + Math.sin(ly * 0.3) * 1;
    context.fillRect(bx, by + ly, bw, bandH);
  }
  context.globalAlpha = alpha;

  context.restore();

  // 3D-Kanten: oben/links hell, unten/rechts dunkel
  // Oberkante — warmer Lichtreflex
  const topGrad = context.createLinearGradient(bx, by, bx, by + bh * 0.2);
  topGrad.addColorStop(0, 'rgba(255,240,200,0.3)');
  topGrad.addColorStop(1, 'rgba(255,240,200,0)');
  context.fillStyle = topGrad;
  roundRect(context, bx, by, bw, bh * 0.25, r);
  context.fill();

  // Linke Kante
  context.fillStyle = 'rgba(255,240,200,0.1)';
  context.fillRect(bx, by + r, Math.max(2, bw * 0.07), bh - r * 2);

  // Unterkante
  context.fillStyle = 'rgba(0,0,0,0.18)';
  context.fillRect(bx + r, by + bh - Math.max(2, bh * 0.07), bw - r * 2, Math.max(2, bh * 0.07));

  // Rechte Kante
  context.fillStyle = 'rgba(0,0,0,0.12)';
  context.fillRect(bx + bw - Math.max(2, bw * 0.07), by + r, Math.max(2, bw * 0.07), bh - r * 2);

  // Feiner Rand (wie geöltes/lackiertes Holz)
  context.strokeStyle = 'rgba(0,0,0,0.2)';
  context.lineWidth = 0.5;
  roundRect(context, bx, by, bw, bh, r);
  context.stroke();

  // Glanzpunkt
  const gloss = context.createRadialGradient(
    bx + bw * 0.3, by + bh * 0.2, 0,
    bx + bw * 0.3, by + bh * 0.2, bw * 0.45
  );
  gloss.addColorStop(0, 'rgba(255,250,230,0.18)');
  gloss.addColorStop(1, 'rgba(255,250,230,0)');
  context.fillStyle = gloss;
  roundRect(context, bx, by, bw, bh, r);
  context.fill();

  context.globalAlpha = 1;
}

// Hilfsfunktionen für Farben und Formen
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lightenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ============================================================
// Score
// ============================================================
function updateScore() {
  scoreEl.textContent = score;
  highscoreEl.textContent = highscore;
}

// ============================================================
// Start
// ============================================================
document.addEventListener('DOMContentLoaded', init);
