/**
 * Blockspiel — Block-Puzzle im Holzdesign
 * Reines HTML/CSS/JS, keine Frameworks
 */

// ============================================================
// Konstanten
// ============================================================
const GRID_SIZE = 10;
const BLOCKS_FOR_TIMER = 100;   // Ab 100 platzierten Blöcken: Timer zählt
const COLORS = [
  '#C0392B', // Rot
  '#2980B9', // Blau
  '#27AE60', // Grün
  '#F39C12', // Orange
  '#8E44AD', // Lila
  '#16A085', // Türkis
  '#D35400', // Dunkelorange
];

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
let totalBlocksPlaced = 0;   // Zählt einzelne Blöcke (Zellen), nicht Formen
let timerActive = false;
let timerStart = 0;
let timerInterval = null;
let trashUsed = false;        // Hilfekasten: einmal pro Spiel nach 100 Blöcken

// Drag-State
let dragPiece = null;
let dragOffset = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let isDragging = false;
let hoverCells = [];

// DOM-Referenzen
let boardEl, previewEl, scoreEl, highscoreEl, gameOverEl, finalScoreEl;
let canvasBoard, ctx, cellSize = 0;
let timerEl, trashEl, trashCountEl;

// ============================================================
// Gaußsche Formauswahl
// ============================================================
function pickRandomShape() {
  // Gewichtete Auswahl basierend auf Größenkategorie
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
        <div class="score-box timer-box hidden" id="timer-box">
          <span class="score-label">Zeit</span>
          <span id="timer">0:00</span>
        </div>
      </div>
    </header>
    <div id="board-wrap">
      <canvas id="board"></canvas>
    </div>
    <div id="preview-row">
      <div id="preview"></div>
      <div id="trash" class="hidden" title="Unpassenden Block hier ablegen">
        <span id="trash-icon">🗑</span>
        <span id="trash-count">1×</span>
      </div>
    </div>
    <div id="block-counter"></div>
    <div id="game-over" class="hidden">
      <div id="game-over-box">
        <h2>Spiel vorbei</h2>
        <p>Punkte: <span id="final-score">0</span></p>
        <p id="final-time-row" class="hidden">Zeit-Bonus: <span id="final-time-bonus">0</span></p>
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
  timerEl = document.getElementById('timer');
  trashEl = document.getElementById('trash');
  trashCountEl = document.getElementById('trash-count');

  document.getElementById('restart-btn').addEventListener('click', newGame);

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

  drawBoard();
  renderPreview();
}

// ============================================================
// Neues Spiel
// ============================================================
function newGame() {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  score = 0;
  totalBlocksPlaced = 0;
  timerActive = false;
  trashUsed = false;
  gameOver = false;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  gameOverEl.classList.add('hidden');
  document.getElementById('timer-box').classList.add('hidden');
  trashEl.classList.add('hidden');
  updateScore();
  updateBlockCounter();
  spawnPieces();
  drawBoard();
}

// ============================================================
// Stücke generieren (Gaußsche Verteilung)
// ============================================================
function spawnPieces() {
  currentPieces = [];
  for (let i = 0; i < 3; i++) {
    const shape = pickRandomShape();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    currentPieces.push({ shape, color });
  }
  renderPreview();
}

function renderPreview() {
  previewEl.innerHTML = '';
  currentPieces.forEach((piece, idx) => {
    if (!piece) {
      const empty = document.createElement('div');
      empty.className = 'preview-slot empty';
      previewEl.appendChild(empty);
      return;
    }
    const slot = document.createElement('div');
    slot.className = 'preview-slot';

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

    // Drag starten — Event auf dem ganzen Slot (nicht nur Canvas)
    const startDrag = (clientX, clientY) => {
      if (gameOver || !currentPieces[idx]) return;
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

    previewEl.appendChild(slot);
  });

  // Trash-Drop-Events
  setupTrashDrop();
}

// ============================================================
// Hilfekasten (Trash)
// ============================================================
function setupTrashDrop() {
  // Trash-Bereich als Drop-Zone: wenn man einen Block draufzieht
  trashEl.onmouseup = onTrashDrop;
  trashEl.ontouchend = onTrashDrop;
}

function onTrashDrop(e) {
  if (!isDragging || !dragPiece || trashUsed) return;
  // Block verwerfen
  currentPieces[dragPiece.index] = null;
  trashUsed = true;
  trashEl.classList.add('used');
  trashCountEl.textContent = '0×';
  isDragging = false;
  dragPiece = null;
  hoverCells = [];
  drawBoard();
  document.querySelectorAll('.preview-slot').forEach(s => s.classList.remove('dragging'));

  if (currentPieces.every(p => p === null)) {
    spawnPieces();
  } else {
    renderPreview();
  }
  checkGameOver();
}

function checkTrashUnlock() {
  if (totalBlocksPlaced >= BLOCKS_FOR_TIMER && !trashUsed) {
    trashEl.classList.remove('hidden');
  }
}

// ============================================================
// Timer-System
// ============================================================
function startTimer() {
  if (timerActive) return;
  timerActive = true;
  timerStart = Date.now();
  document.getElementById('timer-box').classList.remove('hidden');
  timerInterval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  if (!timerActive) return;
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  timerEl.textContent = mins + ':' + String(secs).padStart(2, '0');
}

function getTimerBonus() {
  if (!timerActive) return 0;
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  // Bonus: je schneller, desto mehr Punkte
  // Basis 500, minus 1 pro Sekunde, mindestens 0
  return Math.max(0, 500 - elapsed);
}

function checkTimerStart() {
  if (totalBlocksPlaced >= BLOCKS_FOR_TIMER && !timerActive) {
    startTimer();
  }
}

// ============================================================
// Block-Zähler
// ============================================================
function updateBlockCounter() {
  const el = document.getElementById('block-counter');
  if (totalBlocksPlaced < BLOCKS_FOR_TIMER) {
    el.textContent = totalBlocksPlaced + ' / ' + BLOCKS_FOR_TIMER + ' Blöcke';
  } else {
    el.textContent = totalBlocksPlaced + ' Blöcke';
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
  score += cellCount;
  totalBlocksPlaced += cellCount;

  currentPieces[dragPiece.index] = null;

  clearLines();
  updateScore();
  updateBlockCounter();

  // Timer & Trash nach 100 Blöcken prüfen
  checkTimerStart();
  checkTrashUnlock();

  if (currentPieces.every(p => p === null)) {
    spawnPieces();
  } else {
    renderPreview();
  }

  checkGameOver();
}

// ============================================================
// Reihen und Spalten löschen
// ============================================================
function clearLines() {
  let cleared = 0;
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

  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = null;
    cleared++;
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = null;
    cleared++;
  });

  if (cleared > 0) {
    score += cleared * 10;
    if (cleared > 1) {
      score += (cleared - 1) * 20;
    }
    animateClear(rowsToClear, colsToClear);
  }
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
  const remaining = currentPieces.filter(p => p !== null);
  if (remaining.length === 0) return;

  for (const piece of remaining) {
    if (canPlaceAnywhere(piece.shape)) return;
  }

  // Wenn Trash noch verfügbar, noch kein Game Over
  if (!trashUsed && totalBlocksPlaced >= BLOCKS_FOR_TIMER) return;

  gameOver = true;
  if (timerInterval) clearInterval(timerInterval);

  // Zeit-Bonus berechnen
  const timeBonus = getTimerBonus();
  if (timerActive && timeBonus > 0) {
    score += timeBonus;
    document.getElementById('final-time-row').classList.remove('hidden');
    document.getElementById('final-time-bonus').textContent = '+' + timeBonus;
  } else {
    document.getElementById('final-time-row').classList.add('hidden');
  }

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
// Zeichnen
// ============================================================
function drawBoard() {
  const size = cellSize * GRID_SIZE;
  ctx.fillStyle = '#8B6F47';
  ctx.fillRect(0, 0, size, size);

  // Holzmaserung
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.05) * 2);
    ctx.lineTo(size, y + Math.sin(y * 0.05 + 1) * 2);
    ctx.stroke();
  }

  // Gitterlinien
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size, i * cellSize);
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

function drawBlock(context, x, y, size, color, alpha = 1) {
  const pad = 1;
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
  context.fillStyle = 'rgba(255,255,255,0.3)';
  context.fillRect(x + pad, y + pad, size - pad * 2, 3);
  context.fillRect(x + pad, y + pad, 3, size - pad * 2);
  context.fillStyle = 'rgba(0,0,0,0.2)';
  context.fillRect(x + pad, y + size - pad - 3, size - pad * 2, 3);
  context.fillRect(x + size - pad - 3, y + pad, 3, size - pad * 2);
  context.globalAlpha = 1;
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
