/**
 * Blockspiel — Block-Puzzle im Holzdesign
 * Reines HTML/CSS/JS, keine Frameworks
 */

// ============================================================
// Konstanten
// ============================================================
const GRID_SIZE = 10;
const CELLS_FOR_TIMER = 100;
const CELLS_FOR_RESERVE = 200;
const MAX_CELLS = 1000;
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
const SHAPES = [
  { cells: [[0,0]], name: '1x1', size: 1 },
  { cells: [[0,0],[1,0]], name: '1x2', size: 1 },
  { cells: [[0,0],[0,1]], name: '2x1', size: 1 },
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
  { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], name: '1x5', size: 3 },
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], name: '5x1', size: 3 },
  { cells: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], name: '3x3', size: 3 },
];
const SIZE_WEIGHTS = { 1: 1, 2: 3, 3: 1 };

// Abschluss-Sprüche
const QUOTES = [
  "Nicht schlecht, Holzwurm! \u{1fab5}",
  "Das Brett hat gewonnen... diesmal! \u{1f624}",
  "Tetris-Opa w\u00e4re stolz auf dich! \u{1f474}",
  "Du bist der Block-Fl\u00fcsterer! \u{1f9f1}",
  "Game Over? Nein, Game ENCORE! \u{1f3ad}",
  "Deine Bl\u00f6cke, deine Regeln! \u{1f4aa}",
  "Holz ist geduldig \u2013 du auch? \u{1f333}",
  "Respekt! Das war fast genial! \u{1f605}",
  "Ein Meisterwerk... der Zerst\u00f6rung! \u{1f4a5}",
  "Blockbuster-Leistung! \u{1f3ac}",
  "Mehr Gl\u00fcck als Verstand? Egal, hat Spa\u00df gemacht! \u{1f340}",
  "Die Bl\u00f6cke salutieren dir! \u{1fae1}",
  "Aufgeben? Niemals! Nochmal! \u{1f525}",
  "Du hast Holz vor der H\u00fctte... und auf dem Brett! \u{1f602}",
  "Puzzle-Held mit Macken \u2013 perfekt! \u{2764}\u{fe0f}",
  "Das war blockstark! \u{1f48e}",
  "Dein Highscore weint leise... \u{1f622}",
  "N\u00e4chstes Mal wird\u2019s legend\u00e4r! \u{26a1}",
  "Wie ein Ph\u00f6nix aus der Holzasche! \u{1f525}\u{1fab5}",
  "Du + Bl\u00f6cke = echte Liebe! \u{1f495}",
  "Chapeau! Oder wie der Block sagt: Klotz ab! \u{1f3a9}",
  "Training beendet. N\u00e4chstes Level: Gro\u00dfmeister! \u{1f3c6}",
];

// ============================================================
// Spielzustand
// ============================================================
let grid = [];
let score = 0;
let highscore = 0;
let currentPieces = [];
let gameOver = false;
let totalBlocksPlaced = 0;
let reservePiece = null;
let reserveUnlocked = false;
let formStartTime = 0;
let timeMultiplierActive = false;
let tempoInterval = null;
let dragPiece = null;
let dragOffset = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let isDragging = false;
let hoverCells = [];
let hoverValid = true;
let boardEl, previewEl, scoreEl, highscoreEl, gameOverEl, finalScoreEl;
let canvasBoard, ctx, cellSize = 0;
let reserveEl, tempoEl;

// Sound
let audioCtx = null;
let soundMuted = false;

// Fireworks
let fwCanvas = null;
let fwCtx = null;
let fwParticles = [];
let fwAnimId = null;
let fwSpawnTimer = null;

// ============================================================
// Sound-System (Web Audio API)
// ============================================================
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { /* kein Audio */ }
}

function playTick() {
  if (soundMuted || !audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.connect(g); g.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.04);
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.start(t); osc.stop(t + 0.06);
}

function playClack() {
  if (soundMuted || !audioCtx) return;
  const t = audioCtx.currentTime;
  // Noise burst durch Bandpass = Holz-Klack
  const len = Math.floor(audioCtx.sampleRate * 0.1);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 350; bp.Q.value = 1.8;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(bp); bp.connect(g); g.connect(audioCtx.destination);
  src.start(t);
  // Holz-Resonanz dazu
  const osc = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  osc.connect(g2); g2.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.value = 180;
  g2.gain.setValueAtTime(0.06, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.start(t); osc.stop(t + 0.08);
}

function playSwoosh() {
  if (soundMuted || !audioCtx) return;
  const t = audioCtx.currentTime;
  // Swoosh
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.connect(g); g.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t); osc.stop(t + 0.3);
  // Klingeln
  const ch = audioCtx.createOscillator();
  const cg = audioCtx.createGain();
  ch.connect(cg); cg.connect(audioCtx.destination);
  ch.type = 'sine'; ch.frequency.value = 1500;
  cg.gain.setValueAtTime(0, t + 0.08);
  cg.gain.linearRampToValueAtTime(0.05, t + 0.12);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  ch.start(t + 0.08); ch.stop(t + 0.55);
  // Zweiter Ton
  const ch2 = audioCtx.createOscillator();
  const cg2 = audioCtx.createGain();
  ch2.connect(cg2); cg2.connect(audioCtx.destination);
  ch2.type = 'sine'; ch2.frequency.value = 2000;
  cg2.gain.setValueAtTime(0, t + 0.15);
  cg2.gain.linearRampToValueAtTime(0.03, t + 0.2);
  cg2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  ch2.start(t + 0.15); ch2.stop(t + 0.6);
}

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem('blockspiel-muted', soundMuted ? '1' : '0');
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = soundMuted ? '\u{1f507}' : '\u{1f50a}';
}

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
  soundMuted = localStorage.getItem('blockspiel-muted') === '1';
  buildDOM();
  buildDecorations();
  quickSize();
  newGame();
  resizeBoard();
  requestAnimationFrame(() => resizeBoard());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => resizeBoard());
  }
  window.addEventListener('resize', resizeBoard);
}

function quickSize() {
  const estUsed = 220;
  const availH = window.innerHeight - estUsed;
  const availW = Math.min(window.innerWidth, 580) - 20;
  const maxPx = Math.max(100, Math.min(availH, availW, 560));
  cellSize = Math.max(28, Math.floor(maxPx / GRID_SIZE));
  const boardPx = cellSize * GRID_SIZE;
  canvasBoard.width = boardPx;
  canvasBoard.height = boardPx;
  canvasBoard.style.width = boardPx + 'px';
  canvasBoard.style.height = boardPx + 'px';
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
        <button id="mute-btn" title="Ton an/aus">${soundMuted ? '\u{1f507}' : '\u{1f50a}'}</button>
      </div>
    </header>
    <div id="board-wrap">
      <canvas id="board"></canvas>
    </div>
    <div id="preview-row">
      <div id="preview"></div>
      <div id="reserve" class="locked" title="Reserve-Box">
        <span class="reserve-label">Reserve</span>
        <canvas id="reserve-canvas" width="0" height="0"></canvas>
      </div>
    </div>
    <div id="block-counter"></div>
    <div id="game-over" class="hidden">
      <canvas id="firework-canvas"></canvas>
      <div id="game-over-box">
        <h2>Spiel vorbei</h2>
        <p id="game-quote"></p>
        <p>Punkte: <span id="final-score">0</span></p>
        <button id="restart-btn">Nochmal spielen!</button>
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
  fwCanvas = document.getElementById('firework-canvas');
  fwCtx = fwCanvas.getContext('2d');

  document.getElementById('restart-btn').addEventListener('click', newGame);
  document.getElementById('mute-btn').addEventListener('click', toggleMute);
  reserveEl.addEventListener('click', onReserveSwap);

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);

  // Audio beim ersten Klick initialisieren
  const startAudio = () => { initAudio(); document.removeEventListener('pointerdown', startAudio); };
  document.addEventListener('pointerdown', startAudio);
}

// ============================================================
// Natur-Dekorationen (SVG)
// ============================================================
function buildDecorations() {
  const el = document.createElement('div');
  el.id = 'nature-decor';
  el.setAttribute('aria-hidden', 'true');

  // Colour palette
  const G = ['#2d5a1e','#3d6b2a','#4a8a32','#5a9a3a','#3a7828','#6aaa4a','#4a7a2e'];

  // Ivy leaf (24x23 heart shape)
  const ILP = 'M12,0C8,-1 0,5 2,10Q4,16 8,19L12,23L16,19Q20,16 22,10C24,5 16,-1 12,0Z';
  const iv = (x,y,r,s,ci,o) =>
    `<g transform="translate(${x},${y}) rotate(${r}) scale(${s})"><path d="${ILP}" fill="${G[ci]}" opacity="${o}"/><line x1="12" y1="3" x2="12" y2="18" stroke="rgba(20,50,10,.2)" stroke-width=".5"/></g>`;

  // Flower (outer + center)
  const fl = (x,y,r,c,o) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/><circle cx="${x}" cy="${y}" r="${r*.4}" fill="rgba(250,215,80,.65)"/>`;

  // Moss blob
  const ms = (x,y,w,h,ci,o) =>
    `<path d="M${x},${y+h}Q${x+w*.15},${y+h*.4} ${x+w*.3},${y+h*.25}Q${x+w*.5},${y} ${x+w*.65},${y+h*.2}Q${x+w*.85},${y+h*.35} ${x+w},${y+h}Z" fill="${G[ci]}" opacity="${o}"/>`;

  // Grass blade
  const gr = (x,y,h,c,ci,o) =>
    `<path d="M${x},${y}Q${x+c},${y-h*.6} ${x+c*.5},${y-h}" stroke="${G[ci]}" stroke-width="1.3" opacity="${o}" fill="none" stroke-linecap="round"/>`;

  // Fern frond (procedural)
  const fern = (cx,sy,h,spread,ci1,ci2) => {
    let s = `<path d="M${cx},${sy}Q${cx-1},${sy+h/2} ${cx+1},${sy+h}" stroke="${G[ci1]}" stroke-width="2" opacity=".5" fill="none"/>`;
    const n = Math.floor(h / 18);
    for (let i = 0; i < n; i++) {
      const py = sy + 10 + i * (h - 20) / n;
      const sp = spread * (1 - i / n);
      const o = 0.55 - i * 0.025;
      if (sp < 3) continue;
      s += `<path d="M${cx},${py|0}Q${(cx-sp*.7)|0},${(py-sp*.35)|0} ${(cx-sp)|0},${(py-sp*.15)|0}" stroke="${G[ci1]}" stroke-width="1" opacity="${o.toFixed(2)}" fill="none"/>`;
      s += `<path d="M${cx},${py|0}Q${(cx+sp*.7)|0},${(py-sp*.35)|0} ${(cx+sp)|0},${(py-sp*.15)|0}" stroke="${G[ci2]}" stroke-width="1" opacity="${o.toFixed(2)}" fill="none"/>`;
      for (let j = 1; j <= 3; j++) {
        const f = j * .28, lx = cx - sp * f, ly = py - sp * .12 * j, rx = cx + sp * f;
        const lr = sp * .13, sr = sp * .06;
        if (lr > 1) {
          s += `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${lr.toFixed(1)}" ry="${sr.toFixed(1)}" fill="${G[ci1]}" opacity="${(o-.05).toFixed(2)}" transform="rotate(-25,${lx.toFixed(1)},${ly.toFixed(1)})"/>`;
          s += `<ellipse cx="${rx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${lr.toFixed(1)}" ry="${sr.toFixed(1)}" fill="${G[ci2]}" opacity="${(o-.05).toFixed(2)}" transform="rotate(25,${rx.toFixed(1)},${ly.toFixed(1)})"/>`;
        }
      }
    }
    return s;
  };

  el.innerHTML = `
    <!-- TOP-LEFT: Dense ivy cascade -->
    <div class="deco deco-corner-tl"><svg viewBox="0 0 180 350" fill="none">
      <path d="M12,0Q22,50 42,100Q55,140 42,195Q32,235 52,285Q58,315 48,350" stroke="${G[1]}" stroke-width="3.5" opacity=".6" stroke-linecap="round"/>
      <path d="M0,45Q30,65 55,110Q68,140 88,160" stroke="${G[4]}" stroke-width="2.5" opacity=".5" stroke-linecap="round"/>
      <path d="M38,200Q62,215 82,250Q90,270 98,295" stroke="${G[4]}" stroke-width="2" opacity=".45" stroke-linecap="round"/>
      ${iv(5,15,-15,1.3,2,.72)}${iv(25,50,12,1.5,4,.68)}${iv(48,88,-22,1.1,3,.62)}
      ${iv(58,108,30,.85,2,.58)}${iv(15,120,5,1.4,4,.65)}${iv(38,155,-10,1.6,2,.62)}
      ${iv(26,192,18,1.2,3,.58)}${iv(68,145,25,.8,5,.52)}${iv(48,228,22,1.1,4,.55)}
      ${iv(52,265,-15,1.3,2,.52)}${iv(42,300,8,1.0,3,.48)}${iv(78,185,-8,.7,5,.46)}
      ${iv(85,225,15,.65,4,.42)}${iv(92,260,30,.6,3,.4)}
      ${fl(65,82,5,'rgba(215,160,145,.6)',.6)}${fl(20,148,4.5,'rgba(200,155,180,.55)',.55)}
      ${fl(72,205,4,'rgba(220,175,150,.5)',.5)}
      ${ms(0,0,70,20,0,.32)}${ms(12,6,45,14,1,.26)}
    </svg></div>

    <!-- TOP-RIGHT: Fern cluster with berries -->
    <div class="deco deco-corner-tr"><svg viewBox="0 0 170 330" fill="none">
      ${fern(85,8,300,48,1,4)}
      ${fern(38,5,170,30,4,2)}
      ${fern(138,12,155,25,2,3)}
      <circle cx="52" cy="30" r="2.8" fill="rgba(180,75,75,.42)"/>
      <circle cx="115" cy="42" r="2.2" fill="rgba(180,75,75,.38)"/>
      <circle cx="40" cy="78" r="2.5" fill="rgba(180,75,75,.36)"/>
      <circle cx="125" cy="90" r="2" fill="rgba(150,60,60,.32)"/>
      ${ms(105,0,65,16,0,.3)}${ms(125,5,45,12,1,.24)}
    </svg></div>

    <!-- BOTTOM-LEFT: Wildflower meadow -->
    <div class="deco deco-corner-bl"><svg viewBox="0 0 200 160" fill="none">
      ${gr(15,155,90,-8,2,.5)}${gr(25,155,110,5,4,.48)}${gr(38,155,95,-12,3,.52)}
      ${gr(52,155,120,8,2,.5)}${gr(68,155,85,-5,4,.45)}${gr(80,155,105,10,1,.48)}
      ${gr(95,155,75,-8,3,.42)}${gr(108,155,100,6,2,.46)}${gr(122,155,68,-10,4,.4)}
      ${gr(135,155,88,5,3,.44)}${gr(148,155,60,-6,2,.38)}${gr(160,155,75,8,4,.4)}
      ${gr(172,155,55,-5,1,.36)}${gr(185,155,45,5,3,.34)}
      ${fl(28,52,7,'rgba(215,160,145,.6)',.6)}${fl(60,42,8,'rgba(210,155,175,.55)',.55)}
      ${fl(95,55,6,'rgba(220,175,155,.5)',.5)}${fl(42,75,5.5,'rgba(195,155,185,.5)',.5)}
      ${fl(125,65,6.5,'rgba(215,165,150,.48)',.48)}${fl(155,72,5,'rgba(205,160,180,.45)',.45)}
      ${fl(80,35,5,'rgba(230,190,160,.45)',.45)}
      ${iv(18,90,-40,.7,3,.45)}${iv(75,85,15,.6,5,.4)}${iv(140,95,25,.55,4,.38)}
      ${ms(0,140,80,20,0,.32)}${ms(60,142,50,18,1,.28)}${ms(130,145,70,15,0,.26)}
    </svg></div>

    <!-- BOTTOM-RIGHT: Moss, small fern, ivy -->
    <div class="deco deco-corner-br"><svg viewBox="0 0 180 170" fill="none">
      ${ms(0,145,180,25,0,.35)}${ms(20,140,120,20,1,.3)}${ms(80,148,100,22,6,.25)}
      ${ms(10,130,60,18,4,.28)}${ms(110,132,70,16,0,.26)}
      ${fern(145,10,150,25,2,4)}
      <path d="M170,165Q150,130 130,100Q115,78 125,50Q130,30 120,10" stroke="${G[4]}" stroke-width="2.2" opacity=".5" stroke-linecap="round"/>
      ${iv(125,15,10,.9,2,.55)}${iv(118,45,-20,1.1,3,.52)}${iv(130,80,15,.8,4,.48)}
      ${iv(140,110,-5,1.0,2,.5)}${iv(148,140,20,.7,3,.45)}
      ${fl(110,62,4.5,'rgba(210,165,155,.5)',.5)}
      ${gr(20,158,50,-5,3,.4)}${gr(35,158,40,4,2,.38)}${gr(48,158,55,-6,4,.42)}
      ${gr(62,158,35,5,3,.36)}${gr(75,158,45,-4,2,.38)}
    </svg></div>

    <!-- LEFT EDGE MID: Fern + leaf -->
    <div class="deco deco-edge-lm"><svg viewBox="0 0 80 200" fill="none">
      ${fern(15,5,190,35,1,2)}
      ${iv(5,60,20,.7,3,.45)}${iv(10,120,-15,.6,5,.4)}
    </svg></div>

    <!-- RIGHT EDGE MID: Ivy tendril -->
    <div class="deco deco-edge-rm"><svg viewBox="0 0 80 180" fill="none">
      <path d="M75,0Q60,35 55,70Q48,110 58,145Q62,165 55,180" stroke="${G[4]}" stroke-width="2.2" opacity=".5" stroke-linecap="round"/>
      ${iv(52,20,15,1.0,2,.58)}${iv(48,55,-10,1.2,4,.55)}${iv(55,90,20,.9,3,.52)}
      ${iv(50,125,-15,1.1,2,.5)}${iv(58,155,10,.8,5,.45)}
      ${fl(40,72,3.5,'rgba(210,160,155,.48)',.48)}
    </svg></div>

    <!-- LEFT LOWER: Moss + small fern -->
    <div class="deco deco-edge-ll"><svg viewBox="0 0 70 120" fill="none">
      ${ms(0,95,70,25,0,.32)}${ms(5,88,50,20,1,.28)}
      ${fern(18,5,105,20,4,3)}
    </svg></div>

    <!-- RIGHT LOWER: Flower cluster -->
    <div class="deco deco-edge-rl"><svg viewBox="0 0 80 110" fill="none">
      ${gr(10,108,65,-6,2,.48)}${gr(22,108,80,5,4,.46)}${gr(38,108,55,-8,3,.44)}
      ${gr(50,108,70,6,2,.42)}${gr(62,108,50,-4,4,.4)}
      ${fl(15,40,5.5,'rgba(215,160,145,.55)',.55)}${fl(35,28,6,'rgba(205,155,180,.5)',.5)}
      ${fl(55,38,5,'rgba(220,175,155,.48)',.48)}${fl(28,55,4,'rgba(195,160,170,.45)',.45)}
    </svg></div>

    <!-- TOP CENTER: Hanging tendril -->
    <div class="deco deco-edge-tc"><svg viewBox="0 0 120 80" fill="none">
      <path d="M30,0Q35,25 50,45Q60,58 75,68Q85,75 90,80" stroke="${G[4]}" stroke-width="1.8" opacity=".42" stroke-linecap="round"/>
      ${iv(32,12,-20,.7,3,.48)}${iv(48,35,10,.85,2,.45)}${iv(70,58,25,.65,4,.42)}
      ${ms(0,0,55,10,0,.25)}${ms(70,0,50,8,1,.2)}
    </svg></div>

    <!-- BOTTOM CENTER: Low moss + grass -->
    <div class="deco deco-edge-bc"><svg viewBox="0 0 160 50" fill="none">
      ${ms(0,30,160,20,0,.3)}${ms(20,28,100,18,1,.26)}${ms(60,32,80,18,6,.22)}
      ${gr(15,48,35,-4,3,.4)}${gr(40,48,28,3,2,.38)}${gr(65,48,32,-5,4,.36)}
      ${gr(90,48,25,4,3,.34)}${gr(115,48,30,-3,2,.36)}${gr(140,48,22,3,4,.32)}
    </svg></div>

    <!-- SCATTERED LEAVES -->
    <div class="deco deco-scatter-1"><svg viewBox="0 0 30 22" fill="none"><path d="M2,11Q8,2 15,2Q22,2 28,11Q22,20 15,20Q8,20 2,11Z" fill="${G[2]}" opacity=".5"/><line x1="3" y1="11" x2="27" y2="11" stroke="rgba(40,70,25,.2)" stroke-width=".6"/></svg></div>
    <div class="deco deco-scatter-2"><svg viewBox="0 0 26 18" fill="none"><path d="M2,9Q7,1 13,1Q19,1 24,9Q19,17 13,17Q7,17 2,9Z" fill="${G[4]}" opacity=".45"/><line x1="3" y1="9" x2="23" y2="9" stroke="rgba(40,70,25,.18)" stroke-width=".5"/></svg></div>
    <div class="deco deco-scatter-3"><svg viewBox="0 0 22 16" fill="none"><path d="M2,8Q6,1 11,1Q16,1 20,8Q16,15 11,15Q6,15 2,8Z" fill="${G[3]}" opacity=".42"/></svg></div>
    <div class="deco deco-scatter-4"><svg viewBox="0 0 28 20" fill="none"><path d="M2,10Q8,1 14,1Q20,1 26,10Q20,19 14,19Q8,19 2,10Z" fill="${G[5]}" opacity=".4"/><line x1="3" y1="10" x2="25" y2="10" stroke="rgba(40,70,25,.15)" stroke-width=".5"/></svg></div>
    <div class="deco deco-scatter-5"><svg viewBox="0 0 20 14" fill="none"><path d="M2,7Q5,1 10,1Q15,1 18,7Q15,13 10,13Q5,13 2,7Z" fill="${G[2]}" opacity=".38"/></svg></div>
  `;
  document.body.insertBefore(el, document.body.firstChild);
}

function resizeBoard() {
  const header = document.getElementById('header');
  const previewRow = document.getElementById('preview-row');
  const counter = document.getElementById('block-counter');
  const headerH = header ? header.getBoundingClientRect().height : 48;
  const previewH = (previewRow && previewRow.getBoundingClientRect().height > 20)
    ? previewRow.getBoundingClientRect().height : 100;
  const counterH = (counter && counter.getBoundingClientRect().height > 5)
    ? counter.getBoundingClientRect().height : 20;
  const fixedChrome = 14 + 16 + 16;
  const availH = window.innerHeight - headerH - previewH - counterH - fixedChrome;
  const availW = Math.min(window.innerWidth, 580) - 16;
  const maxBoardPx = Math.max(100, Math.min(availH, availW, 560));
  cellSize = Math.max(28, Math.floor(maxBoardPx / GRID_SIZE));
  const boardPx = cellSize * GRID_SIZE;
  canvasBoard.width = boardPx;
  canvasBoard.height = boardPx;
  canvasBoard.style.width = boardPx + 'px';
  canvasBoard.style.height = boardPx + 'px';
  woodCache = null;
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
  stopFireworks();
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
// Stücke
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

function checkSpawnNeeded() {
  if (currentPieces.every(p => p === null)) {
    if (totalBlocksPlaced >= MAX_CELLS) {
      endGameWon();
    } else {
      spawnPieces();
    }
  }
}

function renderPreview() {
  previewEl.innerHTML = '';
  currentPieces.forEach((piece, idx) => {
    const slot = document.createElement('div');
    slot.className = 'preview-slot';
    if (!piece) {
      slot.classList.add('empty-slot');
      previewEl.appendChild(slot);
      return;
    }
    const { shape, color } = piece;
    let maxC = 0, maxR = 0;
    shape.cells.forEach(([c, r]) => { if (c > maxC) maxC = c; if (r > maxR) maxR = r; });
    const cols = maxC + 1, rows = maxR + 1;
    const pcs = Math.min(28, Math.floor(80 / Math.max(cols, rows)));
    const mc = document.createElement('canvas');
    mc.width = cols * pcs; mc.height = rows * pcs;
    mc.className = 'preview-canvas';
    const mx = mc.getContext('2d');
    shape.cells.forEach(([c, r]) => { drawBlock(mx, c * pcs, r * pcs, pcs, color); });
    slot.appendChild(mc);

    const startDrag = (clientX, clientY) => {
      if (gameOver) return;
      initAudio();
      playTick();
      dragPiece = { shape: piece.shape, color: piece.color, index: idx };
      isDragging = true;
      const rect = slot.getBoundingClientRect();
      dragOffset.x = clientX - rect.left;
      dragOffset.y = clientY - rect.top;
      dragPos.x = clientX;
      dragPos.y = clientY;
      slot.classList.add('dragging');
    };
    slot.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    slot.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    previewEl.appendChild(slot);
  });
}

// ============================================================
// Reserve-Box
// ============================================================
function renderReserve() {
  const canvas = document.getElementById('reserve-canvas');
  if (!canvas) return;
  if (!reserveUnlocked) { reserveEl.classList.add('locked'); reserveEl.classList.remove('empty'); canvas.width = 0; canvas.height = 0; return; }
  reserveEl.classList.remove('locked');
  if (!reservePiece) { canvas.width = 0; canvas.height = 0; reserveEl.classList.add('empty'); return; }
  reserveEl.classList.remove('empty');
  const { shape, color } = reservePiece;
  let maxC = 0, maxR = 0;
  shape.cells.forEach(([c, r]) => { if (c > maxC) maxC = c; if (r > maxR) maxR = r; });
  const rcs = Math.min(20, Math.floor(50 / Math.max(maxC + 1, maxR + 1)));
  canvas.width = (maxC + 1) * rcs; canvas.height = (maxR + 1) * rcs;
  const rx = canvas.getContext('2d'); rx.clearRect(0, 0, canvas.width, canvas.height);
  shape.cells.forEach(([c, r]) => { drawBlock(rx, c * rcs, r * rcs, rcs, color); });
}

function onReserveSwap() {
  if (gameOver || !reserveUnlocked || isDragging) return;
  const firstIdx = currentPieces.findIndex(p => p !== null);
  if (firstIdx === -1) return;
  playTick();
  if (reservePiece === null) {
    reservePiece = currentPieces[firstIdx];
    currentPieces[firstIdx] = null;
    checkSpawnNeeded();
  } else {
    const temp = reservePiece;
    reservePiece = currentPieces[firstIdx];
    currentPieces[firstIdx] = temp;
  }
  formStartTime = Date.now();
  renderPreview(); renderReserve(); checkGameOver();
}

function checkReserveUnlock() {
  if (totalBlocksPlaced >= CELLS_FOR_RESERVE && !reserveUnlocked) { reserveUnlocked = true; renderReserve(); }
}

// ============================================================
// Tempo
// ============================================================
function getTimeMultiplier() {
  if (!timeMultiplierActive) return 1.0;
  const s = (Date.now() - formStartTime) / 1000;
  if (s < 5) return 1.5;
  if (s < 15) return 1.2;
  return 1.0;
}

function updateTempoDisplay() {
  if (!timeMultiplierActive) return;
  const m = getTimeMultiplier();
  tempoEl.textContent = 'x' + m.toFixed(1);
  tempoEl.style.color = m >= 1.5 ? '#2ECC71' : m >= 1.2 ? '#F1C40F' : '#FF6B6B';
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
    el.textContent = totalBlocksPlaced + ' / ' + CELLS_FOR_RESERVE + ' \u2192 Reserve';
  } else {
    el.textContent = totalBlocksPlaced + ' / ' + MAX_CELLS + ' Zellen';
  }
}

// ============================================================
// Drag & Drop
// ============================================================
function onDragMove(e) {
  if (!isDragging) return;
  dragPos.x = e.clientX; dragPos.y = e.clientY;
  updateHover();
}

function onTouchMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  dragPos.x = t.clientX; dragPos.y = t.clientY - 60;
  updateHover();
}

function onDragEnd() {
  if (!isDragging) return;
  tryPlace();
  isDragging = false; dragPiece = null; hoverCells = []; hoverValid = true;
  drawBoard();
  document.querySelectorAll('.preview-slot').forEach(s => s.classList.remove('dragging'));
}

function onTouchEnd() { onDragEnd(); }

function updateHover() {
  if (!dragPiece) return;
  const rect = canvasBoard.getBoundingClientRect();
  const relX = dragPos.x - rect.left;
  const relY = dragPos.y - rect.top;
  const gridCol = Math.round((relX - cellSize / 2) / cellSize);
  const gridRow = Math.round((relY - cellSize / 2) / cellSize);
  hoverCells = []; hoverValid = true;
  for (const [c, r] of dragPiece.shape.cells) {
    const col = gridCol + c, row = gridRow + r;
    hoverCells.push({ col, row });
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) hoverValid = false;
    else if (grid[row][col] !== null) hoverValid = false;
  }
  drawBoard();
}

function tryPlace() {
  if (!hoverValid || hoverCells.length === 0 || !dragPiece) return;
  hoverCells.forEach(({ col, row }) => { grid[row][col] = dragPiece.color; });
  playClack();
  const cellCount = hoverCells.length;
  let basePoints = cellCount;
  if (timeMultiplierActive) basePoints = Math.round(cellCount * getTimeMultiplier());
  score += basePoints;
  totalBlocksPlaced += cellCount;
  clearLines();
  updateScore(); updateBlockCounter();
  checkTempoStart(); checkReserveUnlock();
  currentPieces[dragPiece.index] = null;
  renderPreview();
  if (totalBlocksPlaced >= MAX_CELLS) { endGameWon(); return; }
  checkSpawnNeeded();
  checkGameOver();
}

// ============================================================
// Linien löschen
// ============================================================
function clearLines() {
  let rowsC = [], colsC = [];
  for (let r = 0; r < GRID_SIZE; r++) if (grid[r].every(c => c !== null)) rowsC.push(r);
  for (let c = 0; c < GRID_SIZE; c++) { let f = true; for (let r = 0; r < GRID_SIZE; r++) if (grid[r][c] === null) { f = false; break; } if (f) colsC.push(c); }
  if (rowsC.length === 0 && colsC.length === 0) return;
  playSwoosh();
  const set = new Set();
  rowsC.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) set.add(r * GRID_SIZE + c); });
  colsC.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) set.add(r * GRID_SIZE + c); });
  let ls = set.size;
  if (rowsC.length > 0 && colsC.length > 0) ls *= 2;
  score += ls;
  rowsC.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = null; });
  colsC.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = null; });
  animateClear(rowsC, colsC);
}

function animateClear(rows, cols) {
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  rows.forEach(r => { ctx.fillRect(0, r * cellSize, GRID_SIZE * cellSize, cellSize); });
  cols.forEach(c => { ctx.fillRect(c * cellSize, 0, cellSize, GRID_SIZE * cellSize); });
  setTimeout(() => drawBoard(), 150);
}

// ============================================================
// Game Over / Gewonnen
// ============================================================
function checkGameOver() {
  const remaining = currentPieces.filter(p => p !== null);
  if (remaining.length === 0) return;
  for (const piece of remaining) if (canPlaceAnywhere(piece.shape)) return;
  if (reserveUnlocked && reservePiece !== null && canPlaceAnywhere(reservePiece.shape)) return;
  gameOver = true;
  if (tempoInterval) clearInterval(tempoInterval);
  if (score > highscore) { highscore = score; localStorage.setItem('blockspiel-highscore', String(highscore)); }
  updateScore();
  showEndScreen('Spiel vorbei');
}

function endGameWon() {
  gameOver = true;
  if (tempoInterval) clearInterval(tempoInterval);
  if (score > highscore) { highscore = score; localStorage.setItem('blockspiel-highscore', String(highscore)); }
  updateScore();
  showEndScreen('Gewonnen!');
}

function showEndScreen(title) {
  document.querySelector('#game-over-box h2').textContent = title;
  document.getElementById('game-quote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  finalScoreEl.textContent = score;
  gameOverEl.classList.remove('hidden');
  startFireworks();
}

function canPlaceAnywhere(shape) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let fits = true;
      for (const [dc, dr] of shape.cells) {
        const col = c + dc, row = r + dr;
        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE || grid[row][col] !== null) { fits = false; break; }
      }
      if (fits) return true;
    }
  }
  return false;
}

// ============================================================
// Feuerwerk (Canvas-Partikel)
// ============================================================
function startFireworks() {
  fwCanvas.width = window.innerWidth;
  fwCanvas.height = window.innerHeight;
  fwParticles = [];
  let bursts = 0;
  const maxBursts = 10;
  const spawnBurst = () => {
    const x = Math.random() * fwCanvas.width * 0.8 + fwCanvas.width * 0.1;
    const y = Math.random() * fwCanvas.height * 0.5 + fwCanvas.height * 0.1;
    const colors = ['#FFD700','#FF6B6B','#4CAF50','#42A5F5','#FF9800','#E91E63','#AB47BC','#26C6DA'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      fwParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1,
        decay: 0.008 + Math.random() * 0.015,
        color: col,
        size: 2 + Math.random() * 3,
      });
    }
    bursts++;
    if (bursts < maxBursts) fwSpawnTimer = setTimeout(spawnBurst, 300 + Math.random() * 400);
  };
  spawnBurst();
  fwAnimId = requestAnimationFrame(tickFireworks);
}

function tickFireworks() {
  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
  fwParticles = fwParticles.filter(p => p.life > 0);
  for (const p of fwParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.vx *= 0.99;
    p.life -= p.decay;
    fwCtx.globalAlpha = Math.max(0, p.life);
    fwCtx.fillStyle = p.color;
    fwCtx.beginPath();
    fwCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    fwCtx.fill();
  }
  fwCtx.globalAlpha = 1;
  if (fwParticles.length > 0 || fwSpawnTimer) {
    fwAnimId = requestAnimationFrame(tickFireworks);
  }
}

function stopFireworks() {
  if (fwAnimId) { cancelAnimationFrame(fwAnimId); fwAnimId = null; }
  if (fwSpawnTimer) { clearTimeout(fwSpawnTimer); fwSpawnTimer = null; }
  fwParticles = [];
  if (fwCtx && fwCanvas) fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
}

// ============================================================
// Zeichnen
// ============================================================
let woodCache = null;
let woodCacheSize = 0;

function generateWoodTexture(size) {
  if (woodCache && woodCacheSize === size) return woodCache;
  woodCacheSize = size;
  const oc = document.createElement('canvas');
  oc.width = size; oc.height = size;
  const ox = oc.getContext('2d');
  const bg = ox.createLinearGradient(0, 0, size * 0.15, size);
  bg.addColorStop(0, '#C8A872'); bg.addColorStop(0.25, '#BA9A64');
  bg.addColorStop(0.5, '#B09058'); bg.addColorStop(0.75, '#A8884E'); bg.addColorStop(1, '#9E8048');
  ox.fillStyle = bg; ox.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2.5) {
    ox.beginPath(); ox.moveTo(0, y);
    for (let x = 0; x <= size; x += 6) {
      const w = Math.sin(y * 0.018 + x * 0.004) * 3.5 + Math.sin(y * 0.045 + x * 0.002) * 2 + Math.sin(x * 0.008 + y * 0.025) * 1.5;
      ox.lineTo(x, y + w);
    }
    const i = 0.04 + Math.sin(y * 0.035) * 0.025;
    ox.strokeStyle = (y % 5 < 2.5) ? `rgba(60,35,10,${i})` : `rgba(200,170,120,${i * 0.5})`;
    ox.lineWidth = 1.2; ox.stroke();
  }
  ox.strokeStyle = 'rgba(60,35,10,0.03)'; ox.lineWidth = 0.4;
  for (let y = 0; y < size; y += 1.5) {
    ox.beginPath(); ox.moveTo(0, y + Math.sin(y * 0.07)); ox.lineTo(size, y + Math.sin(y * 0.07 + 1.5)); ox.stroke();
  }
  for (let y = 0; y < size; y += 14 + Math.sin(y * 0.05) * 4) {
    const bw = 4 + Math.sin(y * 0.08) * 2;
    const a = 0.025 + Math.sin(y * 0.12) * 0.01;
    ox.fillStyle = `rgba(60,35,10,${a})`;
    ox.beginPath(); ox.moveTo(0, y);
    for (let x = 0; x <= size; x += 5) ox.lineTo(x, y + Math.sin(y * 0.012 + x * 0.006) * 3);
    for (let x = size; x >= 0; x -= 5) ox.lineTo(x, y + bw + Math.sin(y * 0.012 + x * 0.006) * 3);
    ox.closePath(); ox.fill();
  }
  const sh = ox.createRadialGradient(size * 0.25, size * 0.2, 0, size * 0.25, size * 0.2, size * 0.85);
  sh.addColorStop(0, 'rgba(255,245,210,0.07)'); sh.addColorStop(0.4, 'rgba(255,245,210,0.02)'); sh.addColorStop(1, 'rgba(0,0,0,0.03)');
  ox.fillStyle = sh; ox.fillRect(0, 0, size, size);
  woodCache = oc;
  return oc;
}

function drawBoard() {
  const size = cellSize * GRID_SIZE, cs = cellSize;
  ctx.drawImage(generateWoodTexture(size), 0, 0);
  for (let i = 0; i <= GRID_SIZE; i++) {
    const p = i * cs;
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(p - 0.5, 0); ctx.lineTo(p - 0.5, size); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,180,0.09)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(p + 0.8, 0); ctx.lineTo(p + 0.8, size); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, p - 0.5); ctx.lineTo(size, p - 0.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,180,0.09)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, p + 0.8); ctx.lineTo(size, p + 0.8); ctx.stroke();
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    if (!grid[r]) continue;
    for (let c = 0; c < GRID_SIZE; c++) if (grid[r][c]) drawBlock(ctx, c * cs, r * cs, cs, grid[r][c]);
  }
  if (hoverCells.length > 0 && dragPiece) {
    hoverCells.forEach(({ col, row }) => {
      if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
        drawBlock(ctx, col * cs, row * cs, cs, dragPiece.color, hoverValid ? 0.5 : 0.25);
        if (!hoverValid) {
          ctx.fillStyle = 'rgba(200,40,40,0.18)';
          roundRect(ctx, col * cs + 1.5, row * cs + 1.5, cs - 3, cs - 3, 3);
          ctx.fill();
        }
      }
    });
  }
}

function getWoodType(color) {
  const idx = COLORS.indexOf(color);
  return idx >= 0 ? WOOD_TYPES[idx] : { base: color, dark: darkenColor(color, 30), light: lightenColor(color, 30) };
}

function drawBlock(context, x, y, size, color, alpha = 1) {
  const pad = 1.5, r = Math.min(3.5, size * 0.1);
  const bx = x + pad, by = y + pad, bw = size - pad * 2, bh = size - pad * 2;
  const wood = getWoodType(color);
  context.globalAlpha = alpha;
  context.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(context, bx - 0.5, by - 0.5, bw + 1, bh + 1, r + 0.5); context.fill();
  const bg = context.createLinearGradient(bx, by, bx + bw * 0.2, by + bh);
  bg.addColorStop(0, wood.light); bg.addColorStop(0.3, wood.base);
  bg.addColorStop(0.65, darkenColor(wood.base, 12)); bg.addColorStop(1, wood.dark);
  context.fillStyle = bg;
  roundRect(context, bx, by, bw, bh, r); context.fill();
  context.save();
  roundRect(context, bx, by, bw, bh, r); context.clip();
  const seed = (x * 7 + y * 13) % 100;
  for (let ly = 0; ly < bh; ly += 2) {
    context.beginPath(); context.moveTo(bx, by + ly);
    for (let lx = 0; lx <= bw; lx += 3) {
      const w = Math.sin((ly + seed) * 0.13 + lx * 0.05) + Math.sin((ly + seed) * 0.07 + lx * 0.02) * 0.6;
      context.lineTo(bx + lx, by + ly + w);
    }
    context.strokeStyle = (ly % 4 < 2) ? 'rgba(0,0,0,0.08)' : 'rgba(255,240,200,0.04)';
    context.lineWidth = 0.5; context.stroke();
  }
  for (let ly = 2 + (seed % 4); ly < bh; ly += 6 + (seed % 3)) {
    context.globalAlpha = alpha * 0.045;
    context.fillStyle = wood.dark;
    context.fillRect(bx, by + ly, bw, 1.5 + Math.sin(ly * 0.25));
  }
  context.globalAlpha = alpha; context.restore();
  context.fillStyle = 'rgba(0,0,0,0.15)';
  context.fillRect(bx + r, by, bw - r * 2, Math.max(1.5, bh * 0.05));
  context.fillStyle = 'rgba(0,0,0,0.1)';
  context.fillRect(bx, by + r, Math.max(1.5, bw * 0.05), bh - r * 2);
  context.fillStyle = 'rgba(255,230,180,0.1)';
  context.fillRect(bx + r, by + bh - Math.max(1.5, bh * 0.05), bw - r * 2, Math.max(1.5, bh * 0.05));
  context.fillStyle = 'rgba(255,230,180,0.06)';
  context.fillRect(bx + bw - Math.max(1.5, bw * 0.05), by + r, Math.max(1.5, bw * 0.05), bh - r * 2);
  context.strokeStyle = 'rgba(0,0,0,0.12)'; context.lineWidth = 0.5;
  roundRect(context, bx, by, bw, bh, r); context.stroke();
  const gl = context.createRadialGradient(bx + bw * 0.35, by + bh * 0.3, 0, bx + bw * 0.35, by + bh * 0.3, bw * 0.55);
  gl.addColorStop(0, 'rgba(255,248,230,0.12)'); gl.addColorStop(1, 'rgba(255,248,230,0)');
  context.fillStyle = gl;
  roundRect(context, bx, by, bw, bh, r); context.fill();
  context.globalAlpha = 1;
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}

function lightenColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + ((1 << 24) + (Math.min(255, (n >> 16) + amount) << 16) + (Math.min(255, ((n >> 8) & 0xFF) + amount) << 8) + Math.min(255, (n & 0xFF) + amount)).toString(16).slice(1);
}

function darkenColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + ((1 << 24) + (Math.max(0, (n >> 16) - amount) << 16) + (Math.max(0, ((n >> 8) & 0xFF) - amount) << 8) + Math.max(0, (n & 0xFF) - amount)).toString(16).slice(1);
}

function updateScore() { scoreEl.textContent = score; highscoreEl.textContent = highscore; }

document.addEventListener('DOMContentLoaded', init);
