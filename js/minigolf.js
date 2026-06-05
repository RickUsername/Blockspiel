// minigolf.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let levelDisplay = document.getElementById('level-display');
let strokesDisplay = document.getElementById('strokes-display');
let setupScreen = document.getElementById('setup-screen');
let levelOverScreen = document.getElementById('level-over-screen');
let gameOverScreen = document.getElementById('game-over-screen');
let playerTurnScreen = document.getElementById('player-turn-screen');
let editorScreen = document.getElementById('editor-screen');

// Game Modes & Multiplayer State
let gameMode = 'tournament1p'; // 'training', 'tournament1p', 'tournament2p'
let currentPlayer = 1; // 1 or 2
let p1Scores = [];
let p2Scores = [];

// Game State
let currentLevelIdx = 0;
let levelStrokes = 0;
let difficulty = 'normal'; // 'easy', 'normal', 'hard'
let holeRadius = 14;

// Physics State
let ball = { x: 0, y: 0, vx: 0, vy: 0, r: 8, isMoving: false };
let hole = { x: 0, y: 0, r: 14 };
let currentEnv = { walls: [], sand: [], water: [] };
let stopThreshold = 0.08;
const MAX_STROKES = 10;

// Camera
let cam = { x: 0, y: 0, scale: 1 };

// Interaction
let isAiming = false;
let aimStart = { x: 0, y: 0 };
let aimCurrent = { x: 0, y: 0 };
const maxPower = 20;
const powerMultiplier = 0.15;

// Pinch tracking
let pinchStartDist = 0;
let initialScale = 1;
let lastPan = {x: 0, y: 0};

// Editor State
let isEditorMode = false;
let editorTool = 'start';
let editorStart = { x: 100, y: 100 };
let editorHole = { x: 300, y: 100 };
let editorWalls = [];
let editorSand = [];
let editorWater = [];
let editorDragStart = null;
let editorDragCurrent = null;
let editorDragTarget = null;
let editorPanStart = null;
let editorDragOffset = {x: 0, y: 0};
let invertAim = false;

// Statistics and Game State
let p1Times = [];
let p2Times = [];
let levelStartTime = 0;

// Levels Definition by Difficulty
const baseLevelSets = {
    easy: [
        {"name":"Level 1 einfach","start":{"x":800,"y":550},"hole":{"x":800,"y":100},"walls":[{"x":680,"y":40,"w":240,"h":20},{"x":680,"y":40,"w":20,"h":560},{"x":900,"y":40,"w":20,"h":560},{"x":680,"y":580,"w":240,"h":20}],"sand":[],"water":[]},
        {"name":"Level 2 einfach","start":{"x":800,"y":550},"hole":{"x":800,"y":100},"walls":[{"x":680,"y":40,"w":240,"h":20},{"x":680,"y":40,"w":20,"h":560},{"x":900,"y":40,"w":20,"h":560},{"x":680,"y":580,"w":240,"h":20},{"x":790,"y":290,"w":20,"h":20}],"sand":[{"x":700,"y":230,"w":100,"h":50}],"water":[]},
        {"name":"Level 3 einfach","start":{"x":800,"y":550},"hole":{"x":800,"y":100},"walls":[{"x":680,"y":40,"w":240,"h":20},{"x":680,"y":40,"w":20,"h":560},{"x":900,"y":40,"w":20,"h":560},{"x":680,"y":580,"w":240,"h":20},{"x":790,"y":290,"w":20,"h":20}],"sand":[{"x":700,"y":230,"w":100,"h":50}],"water":[{"x":810,"y":230,"w":80,"h":50}]},
        {"name":"Level 4 einfach","start":{"x":800,"y":550},"hole":{"x":800,"y":100},"walls":[{"x":680,"y":40,"w":240,"h":20},{"x":680,"y":40,"w":20,"h":560},{"x":680,"y":370,"w":240,"h":20},{"x":680,"y":580,"w":340,"h":20},{"x":1000,"y":200,"w":20,"h":400},{"x":920,"y":180,"w":100,"h":20},{"x":900,"y":40,"w":20,"h":160}],"sand":[{"x":700,"y":230,"w":100,"h":50},{"x":920,"y":350,"w":80,"h":60}],"water":[{"x":810,"y":230,"w":80,"h":50}]},
        {"name":"Level 5 einfach","start":{"x":780,"y":480},"hole":{"x":850,"y":100},"walls":[{"x":680,"y":40,"w":240,"h":20},{"x":680,"y":40,"w":20,"h":560},{"x":680,"y":580,"w":240,"h":20},{"x":800,"y":150,"w":120,"h":20},{"x":900,"y":40,"w":20,"h":560},{"x":680,"y":350,"w":150,"h":20}],"sand":[{"x":770,"y":250,"w":40,"h":40},{"x":850,"y":60,"w":50,"h":90}],"water":[{"x":700,"y":540,"w":200,"h":40}]},
        {"name":"Level 6 einfach","start":{"x":730,"y":400},"hole":{"x":850,"y":100},"walls":[{"x":680,"y":40,"w":240,"h":20},{"x":680,"y":580,"w":240,"h":20},{"x":800,"y":150,"w":120,"h":20},{"x":900,"y":40,"w":20,"h":560},{"x":680,"y":350,"w":150,"h":20},{"x":810,"y":350,"w":20,"h":100},{"x":790,"y":150,"w":20,"h":100},{"x":680,"y":480,"w":90,"h":20},{"x":680,"y":40,"w":20,"h":560}],"sand":[{"x":770,"y":250,"w":40,"h":40},{"x":850,"y":60,"w":50,"h":90},{"x":700,"y":500,"w":200,"h":40},{"x":810,"y":210,"w":90,"h":30},{"x":700,"y":60,"w":40,"h":40}],"water":[]},
        {"name":"Level 7 einfach","start":{"x":750,"y":150},"hole":{"x":750,"y":500},"walls":[{"x":500,"y":50,"w":550,"h":20},{"x":500,"y":600,"w":550,"h":20},{"x":700,"y":450,"w":20,"h":100},{"x":780,"y":450,"w":20,"h":100},{"x":700,"y":450,"w":100,"h":20},{"x":500,"y":70,"w":20,"h":530},{"x":1030,"y":70,"w":20,"h":530},{"x":780,"y":100,"w":20,"h":150},{"x":700,"y":100,"w":20,"h":150},{"x":700,"y":100,"w":100,"h":20}],"sand":[{"x":830,"y":550,"w":150,"h":50},{"x":720,"y":120,"w":60,"h":120},{"x":600,"y":430,"w":50,"h":50}],"water":[{"x":980,"y":70,"w":50,"h":530}]},
        {"name":"Level 8 einfach","start":{"x":600,"y":500},"hole":{"x":750,"y":150},"walls":[{"x":630,"y":350,"w":20,"h":110},{"x":630,"y":350,"w":170,"h":20},{"x":500,"y":100,"w":400,"h":20},{"x":500,"y":440,"w":150,"h":20},{"x":500,"y":100,"w":20,"h":450},{"x":780,"y":450,"w":20,"h":100},{"x":670,"y":210,"w":230,"h":20},{"x":880,"y":100,"w":20,"h":450},{"x":500,"y":530,"w":400,"h":20}],"sand":[{"x":850,"y":320,"w":30,"h":110},{"x":520,"y":170,"w":50,"h":160}],"water":[{"x":520,"y":370,"w":110,"h":70}]},
        {"name":"Level 9 einfach","start":{"x":550,"y":480},"hole":{"x":700,"y":200},"walls":[{"x":500,"y":100,"w":400,"h":20},{"x":500,"y":100,"w":20,"h":450},{"x":880,"y":100,"w":20,"h":450},{"x":500,"y":530,"w":400,"h":20},{"x":650,"y":290,"w":100,"h":30}],"sand":[{"x":850,"y":320,"w":30,"h":110},{"x":520,"y":170,"w":50,"h":160}],"water":[{"x":520,"y":370,"w":110,"h":70}]},
        {"name":"Level 10 einfach","start":{"x":570,"y":540},"hole":{"x":1010,"y":90},"walls":[{"x":1030,"y":50,"w":20,"h":600},{"x":450,"y":50,"w":20,"h":600},{"x":450,"y":630,"w":600,"h":20},{"x":450,"y":50,"w":600,"h":20}],"sand":[{"x":700,"y":250,"w":100,"h":150}],"water":[]}
    ],
    normal: [
        { name: "Level 1", start: { x: 440, y: 380 }, hole: { x: 800, y: 80 }, walls: [{ x: 830, y: 50, w: 20, h: 490 }, { x: 630, y: 30, w: 220, h: 20 }, { x: 630, y: 30, w: 20, h: 240 }, { x: 630, y: 250, w: 60, h: 20 }, { x: 330, y: 30, w: 300, h: 20 }, { x: 310, y: 30, w: 20, h: 500 }, { x: 310, y: 520, w: 540, h: 20 }, { x: 310, y: 30, w: 540, h: 20 }], sand: [{ x: 690, y: 230, w: 140, h: 60 }, { x: 380, y: 250, w: 220, h: 60 }, { x: 740, y: 440, w: 90, h: 80 }, { x: 330, y: 370, w: 30, h: 150 }], water: [{ x: 330, y: 50, w: 300, h: 200 }] },
        {"name":"Level 2","start":{"x":200,"y":500},"hole":{"x":500,"y":200},"walls":[{"x":300,"y":300,"w":20,"h":250},{"x":300,"y":300,"w":300,"h":20},{"x":100,"y":100,"w":500,"h":20},{"x":600,"y":100,"w":20,"h":220},{"x":190,"y":290,"w":60,"h":50},{"x":100,"y":100,"w":20,"h":460},{"x":100,"y":540,"w":220,"h":20}],"sand":[{"x":120,"y":120,"w":130,"h":70},{"x":570,"y":120,"w":30,"h":140}],"water":[{"x":470,"y":270,"w":130,"h":30}]},
        {"name":"Level 3","start":{"x":250,"y":500},"hole":{"x":500,"y":500},"walls":[{"x":200,"y":100,"w":20,"h":450},{"x":300,"y":350,"w":20,"h":220},{"x":200,"y":80,"w":350,"h":20},{"x":550,"y":80,"w":20,"h":470},{"x":200,"y":550,"w":370,"h":20}],"sand":[{"x":280,"y":230,"w":220,"h":40},{"x":280,"y":150,"w":70,"h":80}],"water":[{"x":350,"y":150,"w":150,"h":80}]},
        {"name":"Level 4","start":{"x":330,"y":470},"hole":{"x":300,"y":150},"walls":[{"x":150,"y":80,"w":20,"h":500},{"x":430,"y":80,"w":20,"h":500},{"x":150,"y":580,"w":300,"h":20},{"x":150,"y":80,"w":300,"h":20},{"x":250,"y":270,"w":100,"h":20},{"x":290,"y":350,"w":100,"h":20},{"x":170,"y":200,"w":100,"h":20}],"sand":[{"x":170,"y":220,"w":260,"h":130},{"x":170,"y":490,"w":260,"h":40}],"water":[{"x":170,"y":530,"w":260,"h":50}]},
        {"name":"Level 5","start":{"x":300,"y":480},"hole":{"x":300,"y":150},"walls":[{"x":100,"y":80,"w":20,"h":500},{"x":480,"y":80,"w":20,"h":500},{"x":100,"y":580,"w":400,"h":20},{"x":100,"y":80,"w":400,"h":20},{"x":200,"y":250,"w":50,"h":50},{"x":350,"y":250,"w":50,"h":50},{"x":275,"y":400,"w":50,"h":50}],"sand":[{"x":200,"y":320,"w":200,"h":60},{"x":260,"y":100,"w":80,"h":20}],"water":[]},
        {"name":"Level 6","start":{"x":210,"y":520},"hole":{"x":400,"y":150},"walls":[{"x":150,"y":100,"w":20,"h":450},{"x":150,"y":550,"w":300,"h":20},{"x":450,"y":100,"w":20,"h":470},{"x":150,"y":100,"w":320,"h":20},{"x":170,"y":420,"w":200,"h":20},{"x":250,"y":280,"w":200,"h":20}],"sand":[{"x":170,"y":300,"w":80,"h":120}],"water":[]},
        { name: "Level 7", start: { x: 300, y: 600 }, hole: { x: 300, y: 150 }, walls: [{ x: 150, y: 80, w: 20, h: 550 },{ x: 430, y: 80, w: 20, h: 550 },{ x: 150, y: 630, w: 300, h: 20 },{ x: 150, y: 80, w: 300, h: 20 },{ x: 250, y: 250, w: 20, h: 20 },{ x: 330, y: 250, w: 20, h: 20 },{ x: 290, y: 350, w: 20, h: 20 },{ x: 210, y: 450, w: 20, h: 20 },{ x: 370, y: 450, w: 20, h: 20 }], water: [{x: 170, y: 100, w: 60, h: 60}, {x: 370, y: 100, w: 60, h: 60}], sand: [{x: 230, y: 480, w: 140, h: 60}] },
        {"name":"Level 8","start":{"x":420,"y":150},"hole":{"x":200,"y":150},"walls":[{"x":50,"y":50,"w":450,"h":20},{"x":50,"y":70,"w":20,"h":650},{"x":480,"y":70,"w":20,"h":650},{"x":50,"y":720,"w":450,"h":20},{"x":350,"y":50,"w":20,"h":350},{"x":250,"y":380,"w":120,"h":20},{"x":170,"y":550,"w":200,"h":20},{"x":250,"y":400,"w":20,"h":150},{"x":70,"y":200,"w":210,"h":20},{"x":410,"y":310,"w":30,"h":30},{"x":180,"y":640,"w":30,"h":30},{"x":110,"y":360,"w":30,"h":30},{"x":250,"y":130,"w":20,"h":20},{"x":110,"y":150,"w":20,"h":20}],"sand":[{"x":390,"y":480,"w":70,"h":200},{"x":270,"y":330,"w":80,"h":50}],"water":[{"x":70,"y":220,"w":50,"h":60},{"x":270,"y":400,"w":40,"h":150}]},
        {"name":"Level 9","start":{"x":180,"y":480},"hole":{"x":430,"y":110},"walls":[{"x":100,"y":50,"w":400,"h":20},{"x":100,"y":550,"w":400,"h":20},{"x":100,"y":50,"w":20,"h":520},{"x":480,"y":50,"w":20,"h":520},{"x":300,"y":250,"w":50,"h":50}],"sand":[],"water":[]},
        {"name":"Level 10","start":{"x":330,"y":650},"hole":{"x":300,"y":100},"walls":[{"x":100,"y":50,"w":400,"h":20},{"x":100,"y":700,"w":400,"h":20},{"x":100,"y":50,"w":20,"h":670},{"x":480,"y":50,"w":20,"h":670},{"x":100,"y":500,"w":170,"h":20},{"x":330,"y":500,"w":170,"h":20},{"x":100,"y":350,"w":250,"h":20},{"x":100,"y":200,"w":150,"h":20},{"x":350,"y":200,"w":150,"h":20},{"x":250,"y":150,"w":20,"h":70},{"x":330,"y":150,"w":20,"h":70},{"x":250,"y":500,"w":20,"h":70}],"sand":[{"x":270,"y":400,"w":60,"h":100},{"x":410,"y":300,"w":70,"h":30},{"x":220,"y":230,"w":20,"h":60},{"x":230,"y":110,"w":40,"h":40}],"water":[{"x":120,"y":250,"w":100,"h":50},{"x":380,"y":250,"w":100,"h":50},{"x":120,"y":670,"w":360,"h":30},{"x":250,"y":570,"w":20,"h":100},{"x":120,"y":520,"w":130,"h":150}]}
    ],
    hard: [
        {"name":"Level 1 schwer","start":{"x":560,"y":550},"hole":{"x":1010,"y":90},"walls":[],"sand":[{"x":960,"y":70,"w":70,"h":70},{"x":520,"y":250,"w":80,"h":50},{"x":1010,"y":510,"w":20,"h":120}],"water":[{"x":500,"y":580,"w":110,"h":20},{"x":500,"y":50,"w":20,"h":550},{"x":500,"y":50,"w":550,"h":20},{"x":1030,"y":50,"w":20,"h":600},{"x":600,"y":630,"w":450,"h":20},{"x":600,"y":580,"w":20,"h":70},{"x":500,"y":510,"w":430,"h":20},{"x":600,"y":250,"w":450,"h":20}]},
        {"name":"Level 2 schwer","start":{"x":560,"y":550},"hole":{"x":1010,"y":90},"walls":[],"sand":[],"water":[{"x":500,"y":580,"w":110,"h":20},{"x":500,"y":50,"w":20,"h":550},{"x":500,"y":50,"w":550,"h":20},{"x":1030,"y":50,"w":20,"h":600},{"x":600,"y":630,"w":450,"h":20},{"x":600,"y":580,"w":20,"h":70},{"x":500,"y":510,"w":430,"h":20},{"x":600,"y":250,"w":450,"h":20},{"x":750,"y":350,"w":80,"h":70}]},
        {"name":"Level 3 schwer","start":{"x":420,"y":630},"hole":{"x":1010,"y":90},"walls":[{"x":1040,"y":500,"w":10,"h":150},{"x":1040,"y":300,"w":10,"h":150},{"x":400,"y":400,"w":10,"h":150},{"x":400,"y":50,"w":10,"h":300},{"x":1040,"y":50,"w":10,"h":200}],"sand":[{"x":1000,"y":500,"w":50,"h":150},{"x":400,"y":400,"w":50,"h":150},{"x":1000,"y":300,"w":50,"h":150},{"x":400,"y":50,"w":50,"h":300},{"x":450,"y":50,"w":250,"h":50},{"x":1020,"y":50,"w":30,"h":200}],"water":[{"x":350,"y":0,"w":750,"h":50},{"x":350,"y":50,"w":50,"h":650},{"x":400,"y":650,"w":700,"h":50},{"x":1050,"y":50,"w":50,"h":600},{"x":400,"y":550,"w":500,"h":30},{"x":550,"y":450,"w":500,"h":50},{"x":400,"y":350,"w":450,"h":50},{"x":650,"y":250,"w":400,"h":50}]},
        {"name":"Level 4 schwer","start":{"x":420,"y":630},"hole":{"x":1010,"y":90},"walls":[],"sand":[{"x":870,"y":580,"w":30,"h":70},{"x":550,"y":500,"w":30,"h":50},{"x":820,"y":400,"w":30,"h":50},{"x":900,"y":300,"w":70,"h":20}],"water":[{"x":350,"y":0,"w":750,"h":50},{"x":350,"y":50,"w":50,"h":650},{"x":400,"y":650,"w":700,"h":50},{"x":1050,"y":50,"w":50,"h":600},{"x":400,"y":550,"w":500,"h":30},{"x":550,"y":450,"w":500,"h":50},{"x":400,"y":350,"w":450,"h":50},{"x":650,"y":250,"w":400,"h":50}]},
        {"name":"Level 5 schwer","start":{"x":420,"y":630},"hole":{"x":1030,"y":80},"walls":[],"sand":[{"x":1000,"y":550,"w":50,"h":100}],"water":[{"x":350,"y":0,"w":750,"h":50},{"x":350,"y":50,"w":50,"h":650},{"x":400,"y":650,"w":700,"h":50},{"x":1050,"y":50,"w":50,"h":600},{"x":450,"y":150,"w":50,"h":500},{"x":950,"y":50,"w":50,"h":550}]},
        {"name":"Level 6 schwer","start":{"x":420,"y":630},"hole":{"x":1030,"y":80},"walls":[],"sand":[],"water":[{"x":350,"y":0,"w":750,"h":50},{"x":350,"y":50,"w":50,"h":650},{"x":400,"y":650,"w":700,"h":50},{"x":1050,"y":50,"w":50,"h":600},{"x":450,"y":150,"w":50,"h":500},{"x":950,"y":50,"w":50,"h":550},{"x":700,"y":50,"w":50,"h":570},{"x":850,"y":640,"w":50,"h":10}]},
        {"name":"Level 7 schwer","start":{"x":440,"y":380},"hole":{"x":800,"y":80},"walls":[{"x":830,"y":50,"w":20,"h":490},{"x":630,"y":30,"w":220,"h":20},{"x":630,"y":250,"w":60,"h":20},{"x":330,"y":30,"w":300,"h":20},{"x":310,"y":30,"w":20,"h":500},{"x":310,"y":520,"w":540,"h":20},{"x":310,"y":30,"w":540,"h":20},{"x":630,"y":50,"w":20,"h":170}],"sand":[{"x":740,"y":440,"w":90,"h":80},{"x":330,"y":370,"w":30,"h":150},{"x":680,"y":110,"w":50,"h":50},{"x":540,"y":350,"w":110,"h":40}],"water":[{"x":690,"y":230,"w":140,"h":60},{"x":380,"y":260,"w":210,"h":50},{"x":330,"y":50,"w":300,"h":170},{"x":810,"y":50,"w":20,"h":50},{"x":650,"y":50,"w":160,"h":20}]},
        {"name":"Level 8 schwer","start":{"x":200,"y":500},"hole":{"x":500,"y":200},"walls":[{"x":300,"y":300,"w":20,"h":250},{"x":300,"y":300,"w":300,"h":20},{"x":100,"y":100,"w":500,"h":20},{"x":600,"y":100,"w":20,"h":220},{"x":190,"y":290,"w":60,"h":50},{"x":100,"y":100,"w":20,"h":460},{"x":100,"y":540,"w":220,"h":20}],"sand":[{"x":120,"y":120,"w":130,"h":70},{"x":570,"y":120,"w":30,"h":140}],"water":[{"x":470,"y":270,"w":130,"h":30},{"x":180,"y":340,"w":80,"h":10},{"x":180,"y":280,"w":10,"h":70},{"x":250,"y":280,"w":10,"h":70},{"x":180,"y":280,"w":80,"h":10},{"x":120,"y":190,"w":140,"h":10},{"x":440,"y":200,"w":10,"h":20}]},
        {"name":"Level 9 schwer","start":{"x":250,"y":500},"hole":{"x":500,"y":500},"walls":[{"x":200,"y":100,"w":20,"h":450},{"x":300,"y":350,"w":20,"h":220},{"x":200,"y":80,"w":350,"h":20},{"x":550,"y":80,"w":20,"h":470},{"x":200,"y":550,"w":370,"h":20},{"x":240,"y":350,"w":60,"h":20},{"x":350,"y":460,"w":200,"h":20},{"x":320,"y":350,"w":180,"h":20}],"sand":[{"x":280,"y":230,"w":220,"h":40},{"x":280,"y":150,"w":70,"h":80},{"x":320,"y":370,"w":230,"h":90},{"x":320,"y":480,"w":230,"h":70},{"x":320,"y":460,"w":30,"h":20}],"water":[{"x":350,"y":150,"w":150,"h":80}]},
        {"name":"Level 10 schwer","start":{"x":180,"y":370},"hole":{"x":410,"y":190},"walls":[{"x":150,"y":80,"w":20,"h":500},{"x":430,"y":80,"w":20,"h":500},{"x":150,"y":580,"w":300,"h":20},{"x":150,"y":80,"w":300,"h":20},{"x":170,"y":350,"w":230,"h":10},{"x":200,"y":210,"w":230,"h":10},{"x":390,"y":360,"w":10,"h":190},{"x":220,"y":410,"w":120,"h":120},{"x":170,"y":450,"w":30,"h":40},{"x":360,"y":450,"w":30,"h":40}],"sand":[{"x":170,"y":100,"w":260,"h":480}],"water":[{"x":200,"y":390,"w":160,"h":20},{"x":200,"y":530,"w":160,"h":20}]}
    ]
};

// Get base levels for current difficulty
function getBaseLevels() {
    return baseLevelSets[difficulty] || baseLevelSets.normal;
}

let playingLevels = [];
let customLevelNames = [];
let allAvailableLevels = []; // combined list for building custom tournaments
let allAvailableNames = [];
let customTournamentLevels = null; // if set, use these indices for tournament

function getCustomLevels() {
    return JSON.parse(localStorage.getItem('minigolf-custom-levels') || '[]');
}

function getCustomTournaments() {
    return JSON.parse(localStorage.getItem('minigolf-custom-tournaments') || '[]');
}

function loadCustomLevelsAndInit() {
    // Standard levels for selected difficulty
    let baseLevels = getBaseLevels();
    let standardLevels = JSON.parse(JSON.stringify(baseLevels));
    let standardNames = baseLevels.map((l, i) => l.name || `Level ${i+1}`);
    
    // Custom levels from localStorage (separate pool)
    let saved = getCustomLevels();
    
    // For standard tournament: only base levels
    playingLevels = standardLevels;
    customLevelNames = [...standardNames];
    
    // Combined pool for training, editor, and custom tournaments
    allAvailableLevels = [...standardLevels];
    allAvailableNames = [...standardNames];
    saved.forEach(cl => {
        allAvailableLevels.push(cl.data);
        allAvailableNames.push(cl.name + ' ✏️');
    });

    // Populate Level Select Dropdown (training: all levels)
    const selector = document.getElementById('level-select');
    const editorSelector = document.getElementById('editor-load-select');
    
    if (selector) selector.innerHTML = '';
    if (editorSelector) editorSelector.innerHTML = '<option value="" disabled selected>Laden...</option>';
    
    allAvailableLevels.forEach((l, idx) => {
        if (selector) {
            let opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = allAvailableNames[idx];
            selector.appendChild(opt);
        }
        if (editorSelector) {
            let opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = allAvailableNames[idx];
            editorSelector.appendChild(opt);
        }
    });
    
    // Populate custom tournament selector
    updateCustomTournamentUI();
    // Populate custom level manager
    updateCustomLevelManagerUI();
}

function updateCustomLevelManagerUI() {
    const list = document.getElementById('custom-level-list');
    if (!list) return;
    let saved = getCustomLevels();
    if (saved.length === 0) {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">Keine eigenen Level vorhanden.</p>';
        return;
    }
    list.innerHTML = '';
    saved.forEach((cl, i) => {
        let row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.2);border-radius:6px;margin-bottom:0.3rem;';
        row.innerHTML = `<span style="color:#eee;font-size:0.85rem;">${cl.name}</span>
            <button class="delete-custom-lvl" data-idx="${i}" style="background:rgba(200,50,50,0.6);border:none;color:#fff;padding:0.2rem 0.5rem;border-radius:4px;cursor:pointer;font-size:0.8rem;">🗑️</button>`;
        list.appendChild(row);
    });
    list.querySelectorAll('.delete-custom-lvl').forEach(btn => {
        btn.addEventListener('click', () => {
            let idx = parseInt(btn.dataset.idx);
            let s = getCustomLevels();
            s.splice(idx, 1);
            localStorage.setItem('minigolf-custom-levels', JSON.stringify(s));
            loadCustomLevelsAndInit();
        });
    });
}

function updateCustomTournamentUI() {
    const sel = document.getElementById('custom-tournament-select');
    if (!sel) return;
    let tournaments = getCustomTournaments();
    sel.innerHTML = '<option value="" selected>Standard (10 Level)</option>';
    tournaments.forEach((t, i) => {
        let opt = document.createElement('option');
        opt.value = i;
        opt.textContent = t.name + ` (${t.levelIndices.length} Level)`;
        sel.appendChild(opt);
    });
}

function resizeCanvas() {
    const pr = window.devicePixelRatio || 1;
    let cw = canvas.parentElement.clientWidth;
    let ch = canvas.parentElement.clientHeight;
    canvas.width = cw * pr;
    canvas.height = ch * pr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function loadHighscore() {
    const data = localStorage.getItem('minigolf-highscore');
    if (data) return JSON.parse(data);
    return { 'easy': '-', 'normal': '-', 'hard': '-' };
}

function saveHighscore(score) {
    if (gameMode !== 'tournament1p') return;
    const hs = loadHighscore();
    if (hs[difficulty] === '-' || score < hs[difficulty]) {
        hs[difficulty] = score;
        localStorage.setItem('minigolf-highscore', JSON.stringify(hs));
    }
}

function updateHighscoreUI() {
    const hs = loadHighscore();
    const diffNames = { 'easy': 'Leicht', 'normal': 'Normal', 'hard': 'Schwer' };
    const scoreStr = hs[difficulty];
    document.getElementById('highscore-display').textContent = `Turnier Rekord (${diffNames[difficulty]}): ${scoreStr}`;
}

function startLevel(idx, player) {
    if (idx >= playingLevels.length) {
        finishGame();
        return;
    }
    
    currentLevelIdx = idx;
    currentPlayer = player;
    levelStrokes = 0;
    levelStartTime = Date.now();
    hole.r = 14;
    
    const lvl = playingLevels[idx];
    currentEnv.walls = lvl.walls || [];
    currentEnv.sand = lvl.sand || [];
    currentEnv.water = lvl.water || [];
    
    hole.x = lvl.hole.x;
    hole.y = lvl.hole.y;
    resetBall();
    
    centerCamera();
    updateUI();
}

function resetBall(penalty = 0) {
    const lvl = playingLevels[currentLevelIdx];
    ball.x = lvl.start.x;
    ball.y = lvl.start.y;
    ball.vx = 0;
    ball.vy = 0;
    ball.isMoving = false;
    if (penalty > 0) {
        levelStrokes += penalty;
        updateUI();
    }
}

function centerCamera() {
    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;

    const extendBounds = (x, y, w = 0, h = 0) => {
        if (x < minX) minX = x;
        if (x + w > maxX) maxX = x + w;
        if (y < minY) minY = y;
        if (y + h > maxY) maxY = y + h;
    };

    currentEnv.walls.forEach(w => extendBounds(w.x, w.y, w.w, w.h));
    (currentEnv.sand || []).forEach(s => extendBounds(s.x, s.y, s.w, s.h));
    (currentEnv.water || []).forEach(w => extendBounds(w.x, w.y, w.w, w.h));
    if (isEditorMode) {
        extendBounds(editorStart.x - 10, editorStart.y - 10, 20, 20);
        extendBounds(editorHole.x - 16, editorHole.y - 16, 32, 32);
    } else {
        extendBounds(ball.x - 10, ball.y - 10, 20, 20);
        extendBounds(hole.x - 16, hole.y - 16, 32, 32);
    }

    // Fallback if empty
    if (minX === 9999) { minX = 0; maxX = 600; minY = 0; maxY = 600; }

    const levelCenter = { x: minX + (maxX - minX)/2, y: minY + (maxY - minY)/2 };
    const levelWidth = maxX - minX;
    const levelHeight = maxY - minY;

    const pr = window.devicePixelRatio || 1;
    // Effective drawable area (subtract UI overlays in editor mode)
    let effW = canvas.width;
    let effH = canvas.height;
    let offsetX = 0;
    let offsetY = 0;
    if (isEditorMode) {
        const topBar = document.querySelector('#editor-screen > div:first-child');
        const botBar = document.querySelector('#editor-screen > div:last-child');
        const topH = (topBar ? topBar.offsetHeight : 0) * pr;
        const botH = (botBar ? botBar.offsetHeight : 0) * pr;
        effH = Math.max(100, canvas.height - topH - botH);
        offsetY = (topH - botH) / 2;
    }

    const padding = 60 * pr;
    const scaleX = effW / (levelWidth + padding);
    const scaleY = effH / (levelHeight + padding);
    cam.scale = Math.min(scaleX, scaleY);
    if (cam.scale > 1.5) cam.scale = 1.5;

    cam.x = (canvas.width / 2) + offsetX - (levelCenter.x * cam.scale);
    cam.y = (canvas.height / 2) + offsetY - (levelCenter.y * cam.scale);
}

function updateUI() {
    levelDisplay.textContent = `${currentLevelIdx + 1} / ${gameMode === 'training' ? '1' : playingLevels.length}`;
    document.getElementById('strokes-display').textContent = `${levelStrokes} / ${MAX_STROKES}`;
    
    const pDisplay = document.getElementById('current-player-display');
    if (gameMode === 'tournament2p') {
        pDisplay.textContent = (currentPlayer === 1) ? '- Spieler 1' : '- Spieler 2';
        pDisplay.style.color = (currentPlayer === 1) ? '#8fbdf5' : '#D4A040';
    } else {
        pDisplay.textContent = '';
    }
}

// Controls
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const pr = window.devicePixelRatio || 1;
    let x, y;
    if (e.touches && e.touches.length > 0) {
        x = (e.touches[0].clientX - rect.left) * pr;
        y = (e.touches[0].clientY - rect.top) * pr;
    } else {
        x = (e.clientX - rect.left) * pr;
        y = (e.clientY - rect.top) * pr;
    }
    return { x: (x - cam.x) / cam.scale, y: (y - cam.y) / cam.scale };
}

function getPinchDist(e) {
    if (e.touches && e.touches.length >= 2) {
        const pr = window.devicePixelRatio || 1;
        const dx = (e.touches[0].clientX - e.touches[1].clientX) * pr;
        const dy = (e.touches[0].clientY - e.touches[1].clientY) * pr;
        return Math.sqrt(dx*dx + dy*dy);
    }
    return null;
}

function getPinchCenter(e) {
    const rect = canvas.getBoundingClientRect();
    const pr = window.devicePixelRatio || 1;
    return {
        x: ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * pr,
        y: ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * pr
    };
}

let playPanStart = null;

canvas.addEventListener('mousedown', (e) => {
    // Right-click drag → pan in play mode (and editor if no tool-drag active)
    if (e.button === 2) {
        e.preventDefault();
        playPanStart = { x: e.clientX, y: e.clientY };
        return;
    }
    pointerStart(e);
});
canvas.addEventListener('mousemove', (e) => {
    if (playPanStart) {
        const pr = window.devicePixelRatio || 1;
        cam.x += (e.clientX - playPanStart.x) * pr;
        cam.y += (e.clientY - playPanStart.y) * pr;
        playPanStart = { x: e.clientX, y: e.clientY };
        return;
    }
    pointerMove(e);
});
canvas.addEventListener('mouseup', (e) => {
    if (playPanStart) { playPanStart = null; return; }
    pointerEnd(e);
});
canvas.addEventListener('mouseleave', (e) => {
    playPanStart = null;
    pointerEnd(e);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
    if (isPopupVisible() && !isEditorMode) return;
    e.preventDefault();
    const pr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * pr;
    const cy = (e.clientY - rect.top) * pr;
    const zoom = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(0.1, Math.min(5, cam.scale * zoom));
    const dec = newScale / cam.scale;
    cam.x = cx - (cx - cam.x) * dec;
    cam.y = cy - (cy - cam.y) * dec;
    cam.scale = newScale;
}, { passive: false });
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); pointerStart(e); }, {passive: false});
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); pointerMove(e); }, {passive: false});
canvas.addEventListener('touchend', (e) => { e.preventDefault(); pointerEnd(e); }, {passive: false});

function isPopupVisible() {
    return !setupScreen.classList.contains('hidden') || 
           !levelOverScreen.classList.contains('hidden') || 
           !gameOverScreen.classList.contains('hidden') || 
           !playerTurnScreen.classList.contains('hidden') ||
           isEditorMode;
}

function snap(val) {
    return Math.round(val / 10) * 10;
}

function pointerStart(e) {
    // EDITOR LOGIC
    if (isEditorMode) {
        if (e.touches && e.touches.length >= 2) {
            // allow pinch pan in editor too
            isAiming = false;
            pinchStartDist = getPinchDist(e);
            initialScale = cam.scale;
            const center = getPinchCenter(e);
            lastPan = { x: center.x - cam.x, y: center.y - cam.y };
            return;
        }

        if (editorTool === 'pan') {
            editorPanStart = { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY };
            return;
        }

        const pos = getPointerPos(e);
        const sx = snap(pos.x);
        const sy = snap(pos.y);

        if (editorTool === 'start') { editorStart = {x: sx, y: sy}; return; }
        if (editorTool === 'hole') { editorHole = {x: sx, y: sy}; return; }
        
        if (editorTool === 'move') {
            const hitTestObj = (arr) => {
                for (let i = arr.length - 1; i >= 0; i--) {
                    if (pos.x >= arr[i].x && pos.x <= arr[i].x + arr[i].w && 
                        pos.y >= arr[i].y && pos.y <= arr[i].y + arr[i].h) {
                        return arr[i];
                    }
                }
                return null;
            };
            if (Math.hypot(pos.x - editorStart.x, pos.y - editorStart.y) < 15) {
                editorDragTarget = editorStart; editorDragOffset = {x: pos.x - editorStart.x, y: pos.y - editorStart.y}; return;
            }
            if (Math.hypot(pos.x - editorHole.x, pos.y - editorHole.y) < hole.r + 5) {
                editorDragTarget = editorHole; editorDragOffset = {x: pos.x - editorHole.x, y: pos.y - editorHole.y}; return;
            }
            let hit = hitTestObj(editorWalls) || hitTestObj(editorSand) || hitTestObj(editorWater);
            if (hit) {
                editorDragTarget = hit; editorDragOffset = {x: pos.x - hit.x, y: pos.y - hit.y}; return;
            }
            return;
        }

        if (editorTool === 'erase') {
            const hitTest = (arr) => {
                for (let i = arr.length - 1; i >= 0; i--) {
                    if (pos.x >= arr[i].x && pos.x <= arr[i].x + arr[i].w && 
                        pos.y >= arr[i].y && pos.y <= arr[i].y + arr[i].h) {
                        arr.splice(i, 1);
                        return true;
                    }
                }
                return false;
            };
            if (hitTest(editorWalls)) return;
            if (hitTest(editorSand)) return;
            if (hitTest(editorWater)) return;
            return;
        }

        // Rect drag start (Sand / Water)
        editorDragStart = { x: sx, y: sy };
        editorDragCurrent = { x: sx, y: sy };
        return;
    }

    // GAMEPLAY LOGIC
    if (ball.isMoving || isPopupVisible()) return;
    if (e.touches && e.touches.length >= 2) {
        isAiming = false;
        pinchStartDist = getPinchDist(e);
        initialScale = cam.scale;
        const center = getPinchCenter(e);
        lastPan = { x: center.x - cam.x, y: center.y - cam.y };
        return;
    }
    isAiming = true;
    aimStart = aimCurrent = getPointerPos(e);
}

function pointerMove(e) {
    if (isEditorMode) {
        if (e.touches && e.touches.length >= 2 && pinchStartDist) {
            handlePinchPan(e);
            return;
        }
        if (editorTool === 'pan' && editorPanStart) {
            const curX = e.touches ? e.touches[0].clientX : e.clientX;
            const curY = e.touches ? e.touches[0].clientY : e.clientY;
            const pr = window.devicePixelRatio || 1;
            cam.x += (curX - editorPanStart.x) * pr;
            cam.y += (curY - editorPanStart.y) * pr;
            editorPanStart = { x: curX, y: curY };
            return;
        }
        if (editorDragTarget) {
            const pos = getPointerPos(e);
            editorDragTarget.x = snap(pos.x - editorDragOffset.x);
            editorDragTarget.y = snap(pos.y - editorDragOffset.y);
            return;
        }
        if (editorDragStart) {
            const pos = getPointerPos(e);
            editorDragCurrent = { x: snap(pos.x), y: snap(pos.y) };
        }
        return;
    }

    if (e.touches && e.touches.length >= 2 && !isAiming) {
        handlePinchPan(e);
        return;
    }
    if (!isAiming) return;
    aimCurrent = getPointerPos(e);
}

function pointerEnd(e) {
    if (isEditorMode) {
        if (editorTool === 'pan') {
            editorPanStart = null;
            return;
        }
        if (editorDragTarget) {
            editorDragTarget = null;
            return;
        }
        if (editorDragStart && editorDragCurrent) {
            let x = Math.min(editorDragStart.x, editorDragCurrent.x);
            let y = Math.min(editorDragStart.y, editorDragCurrent.y);
            let w = Math.abs(editorDragStart.x - editorDragCurrent.x);
            let h = Math.abs(editorDragStart.y - editorDragCurrent.y);
            if (w > 0 && h > 0) {
                if (editorTool === 'sand') editorSand.push({x, y, w, h});
                else if (editorTool === 'water') editorWater.push({x, y, w, h});
                else if (editorTool === 'wall') editorWalls.push({x, y, w, h});
            }
        }
        editorDragStart = null;
        editorDragCurrent = null;
        return;
    }

    if (!isAiming) return;
    isAiming = false;
    
    let dx = aimStart.x - aimCurrent.x;
    let dy = aimStart.y - aimCurrent.y;
    if (invertAim) { dx = -dx; dy = -dy; }

    const vx = dx * powerMultiplier;
    const vy = dy * powerMultiplier;
    
    const p = Math.sqrt(vx*vx + vy*vy);
    if (p > 0.5) {
        const factor = p > maxPower ? maxPower / p : 1;
        ball.vx = vx * factor;
        ball.vy = vy * factor;
        ball.isMoving = true;
        levelStrokes++;
        updateUI();
    }
}

function handlePinchPan(e) {
    const dist = getPinchDist(e);
    const center = getPinchCenter(e);
    let newScale = initialScale * (dist / pinchStartDist);
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;
    const scaleDec = newScale / cam.scale;
    cam.x = center.x - (center.x - cam.x) * scaleDec;
    cam.y = center.y - (center.y - cam.y) * scaleDec;
    cam.x += center.x - (lastPan.x + cam.x);
    cam.y += center.y - (lastPan.y + cam.y);
    lastPan = { x: center.x - cam.x, y: center.y - cam.y };
    cam.scale = newScale;
}

// Sub-Stepping Physics Engine
function updatePhysics() {
    if (isEditorMode || !ball.isMoving) return;

    const velVectorLength = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
    const steps = Math.max(1, Math.ceil(velVectorLength / (ball.r * 0.8)));
    const s_vx = ball.vx / steps;
    const s_vy = ball.vy / steps;

    for (let i = 0; i < steps; i++) {
        ball.x += s_vx;
        ball.y += s_vy;

        let hit = false;
        currentEnv.walls.forEach(w => {
            let cx = Math.max(w.x, Math.min(w.x + w.w, ball.x));
            let cy = Math.max(w.y, Math.min(w.y + w.h, ball.y));
            let dx = ball.x - cx;
            let dy = ball.y - cy;
            let distSq = dx*dx + dy*dy;
            
            if (distSq < ball.r * ball.r) {
                const dist = Math.sqrt(distSq);
                const over = ball.r - dist;
                if (dist > 0) {
                    ball.x += (dx/dist) * over;
                    ball.y += (dy/dist) * over;
                }
                if (cx > w.x && cx < w.x + w.w) ball.vy *= -0.8;
                else if (cy > w.y && cy < w.y + w.h) ball.vx *= -0.8;
                else {
                    let nx = dx / dist; let ny = dy / dist;
                    let dot = ball.vx * nx + ball.vy * ny;
                    ball.vx -= 2 * dot * nx;
                    ball.vy -= 2 * dot * ny;
                    ball.vx *= 0.8; ball.vy *= 0.8;
                }
            }
        });
    }

    let groundFriction = 0.985;
    currentEnv.sand.forEach(s => {
        if (ball.x > s.x && ball.x < s.x + s.w && ball.y > s.y && ball.y < s.y + s.h) {
            groundFriction = 0.92;
        }
    });

    ball.vx *= groundFriction;
    ball.vy *= groundFriction;

    currentEnv.water.forEach(w => {
        if (ball.x > w.x && ball.x < w.x + w.w && ball.y > w.y && ball.y < w.y + w.h) {
            resetBall(1);
            return;
        }
    });

    if (Math.abs(ball.vx) < stopThreshold && Math.abs(ball.vy) < stopThreshold && !ball.isMoving === false) {
        ball.vx = 0; ball.vy = 0;
        ball.isMoving = false;
        
        if (ball.x < -2000 || ball.y < -2000 || ball.x > 8000 || ball.y > 8000) {
            resetBall(1);
            return;
        }

        const hdist = Math.sqrt((ball.x - hole.x)**2 + (ball.y - hole.y)**2);
        if (hdist < hole.r - 2) {
            processLevelEnd();
            return;
        }

        if (levelStrokes >= MAX_STROKES) {
            levelStrokes = MAX_STROKES;
            processLevelEnd();
            return;
        }
    } else {
        if (velVectorLength < 8) {
            const hdist = Math.sqrt((ball.x - hole.x)**2 + (ball.y - hole.y)**2);
            if (hdist < hole.r - 2) {
                ball.vx = 0; ball.vy = 0; ball.isMoving = false;
                processLevelEnd();
                return;
            }
        }
    }
}

function processLevelEnd() {
    let elapsed = (Date.now() - levelStartTime) / 1000;
    
    if (currentPlayer === 1) {
        p1Scores.push(levelStrokes);
        p1Times.push(elapsed);
    } else {
        p2Scores.push(levelStrokes);
        p2Times.push(elapsed);
        
        if (gameMode === 'tournament2p') {
            let p1S = p1Scores[currentLevelIdx];
            let p2S = p2Scores[currentLevelIdx];
            let p1T = p1Times[currentLevelIdx];
            let p2T = p2Times[currentLevelIdx];
            if (p1S === p2S) {
                if (p1T > p2T) p1Scores[currentLevelIdx] += 0.1;
                else if (p2T > p1T) p2Scores[currentLevelIdx] += 0.1;
            }
        }
    }
    
    document.getElementById('level-strokes-result').textContent = levelStrokes;
    
    if (gameMode === 'training') {
        levelOverScreen.classList.remove('hidden');
        document.getElementById('next-level-btn').textContent = "Zurück ins Menü";
    } else if (gameMode === 'tournament1p') {
        levelOverScreen.classList.remove('hidden');
        document.getElementById('next-level-btn').textContent = (currentLevelIdx === playingLevels.length - 1) ? "Ergebnis ansehen" : "Nächstes Level";
    } else if (gameMode === 'tournament2p') {
        if (currentPlayer === 1) {
            document.getElementById('next-player-name').textContent = "Spieler 2";
            document.getElementById('next-player-level').textContent = customLevelNames[currentLevelIdx];
            playerTurnScreen.classList.remove('hidden');
        } else {
            if (currentLevelIdx === playingLevels.length - 1) {
                finishGame();
            } else {
                document.getElementById('next-player-name').textContent = "Spieler 1";
                document.getElementById('next-player-level').textContent = customLevelNames[currentLevelIdx + 1];
                playerTurnScreen.classList.remove('hidden');
            }
        }
    }
}

function finishGame() {
    let tot1 = p1Scores.reduce((a,b)=>a+b, 0);
    let tot2 = p2Scores.reduce((a,b)=>a+b, 0);
    let time1 = p1Times.reduce((a,b)=>a+b, 0) || 0;
    let time2 = p2Times.reduce((a,b)=>a+b, 0) || 0;
    const div = document.getElementById('game-over-screen').querySelector('.modal-box');
    
    if (gameMode === 'tournament1p') {
        div.innerHTML = `<h2>Turnier beendet!</h2>
            <p>Dein Ergebnis: <b>${tot1}</b> Schläge</p>
            <p>Gesamtzeit: ${time1.toFixed(1)} s</p>
            <p>Modus: ${document.querySelector('.diff-sel-btn.active').textContent}</p>
            <button id="restart-game-btn" class="primary-btn mt">Zurück ins Menü</button>`;
        saveHighscore(tot1);
    } else if (gameMode === 'tournament2p') {
        let winner;
        if (tot1 < tot2) winner = "Spieler 1 gewinnt!";
        else if (tot2 < tot1) winner = "Spieler 2 gewinnt!";
        else {
            if (time1 < time2) winner = "Spieler 1 gewinnt (Zeit)!";
            else if (time2 < time1) winner = "Spieler 2 gewinnt (Zeit)!";
            else winner = "Unentschieden!";
        }
        div.innerHTML = `<h2>${winner}</h2>
            <p>Spieler 1: <b>${tot1.toFixed(1).replace('.0', '')}</b> Schläge (${time1.toFixed(1)} s)</p>
            <p>Spieler 2: <b>${tot2.toFixed(1).replace('.0', '')}</b> Schläge (${time2.toFixed(1)} s)</p>
            <p>Modus: ${document.querySelector('.diff-sel-btn.active').textContent}</p>
            <button id="restart-game-btn" class="primary-btn mt">Zurück ins Menü</button>`;
    }
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        updateHighscoreUI();
    });
    gameOverScreen.classList.remove('hidden');
}

// Draw Objects Helper with Premium Graphics
function drawEnv(envWalls, envSand, envWater) {
    const t = Date.now() / 1000;

    // Draw Sand
    envSand.forEach(s => {
        ctx.fillStyle = '#d2b97f';
        ctx.fillRect(s.x, s.y, s.w, s.h);
        
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(s.x, s.y, s.w, 4);
        ctx.fillRect(s.x, s.y, 4, s.h);

        ctx.fillStyle = '#bfa56a';
        ctx.beginPath();
        for (let i = 10; i < s.w; i += 20) {
            for (let j = 10; j < s.h; j += 20) {
                if ((i + j) % 40 === 0) {
                    ctx.rect(s.x + i - 2, s.y + j - 2, 4, 4);
                }
            }
        }
        ctx.fill();
        
        ctx.strokeStyle = '#a68b4f';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x, s.y, s.w, s.h);
    });

    // Draw Water
    envWater.forEach(w => {
        let grad = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
        grad.addColorStop(0, '#2e78c4');
        grad.addColorStop(1, '#1b5b91');
        ctx.fillStyle = grad;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 10; i < w.w - 10; i += 30) {
            for (let j = 10; j < w.h - 10; j += 25) {
                let yOffset = Math.sin(t * 2 + i) * 4;
                ctx.moveTo(w.x + i, w.y + j + yOffset);
                ctx.arcTo(w.x + i + 5, w.y + j - 5 + yOffset, w.x + i + 10, w.y + j + yOffset, 5);
            }
        }
        ctx.stroke();

        ctx.strokeStyle = '#103960';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    // Draw Walls
    envWalls.forEach(w => {
        ctx.fillStyle = '#785335';
        ctx.fillRect(w.x, w.y, w.w, w.h);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(w.x, w.y, w.w, 4);
        ctx.fillRect(w.x, w.y, 4, w.h);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
        ctx.fillRect(w.x + w.w - 4, w.y, 4, w.h);
        
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        for(let i=10; i<w.w; i+=20) { ctx.rect(w.x+i, w.y+4, 1, w.h-8); }
        for(let j=10; j<w.h; j+=20) { ctx.rect(w.x+4, w.y+j, w.w-8, 1); }
        ctx.fill();
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.scale, cam.scale);

    if (isEditorMode) {
        drawEnv(editorWalls, editorSand, editorWater);
        
        // Draw Start and Hole proxies
        ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(editorHole.x, editorHole.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(editorStart.x, editorStart.y, 8, 0, Math.PI * 2); ctx.fill();

        // Editor Drag overlay
        if (editorDragStart && editorDragCurrent) {
            let x = Math.min(editorDragStart.x, editorDragCurrent.x);
            let y = Math.min(editorDragStart.y, editorDragCurrent.y);
            let w = Math.abs(editorDragStart.x - editorDragCurrent.x);
            let h = Math.abs(editorDragStart.y - editorDragCurrent.y);
            if (editorTool === 'sand') { ctx.fillStyle = 'rgba(235, 195, 110, 0.8)'; ctx.fillRect(x,y,w,h); }
            if (editorTool === 'water') { ctx.fillStyle = 'rgba(20, 90, 160, 0.8)'; ctx.fillRect(x,y,w,h); }
            if (editorTool === 'wall') { ctx.fillStyle = 'rgba(107, 74, 44, 0.8)'; ctx.fillRect(x,y,w,h); }
        }

        // Draw grid overlay faintly
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = -2000; x < 2000; x+=50) { ctx.moveTo(x, -2000); ctx.lineTo(x, 2000); }
        for (let y = -2000; y < 2000; y+=50) { ctx.moveTo(-2000, y); ctx.lineTo(2000, y); }
        ctx.stroke();

    } else {
        drawEnv(currentEnv.walls, currentEnv.sand, currentEnv.water);
        
        const lvl = playingLevels[currentLevelIdx];
        if (lvl) {
            let startGrad = ctx.createRadialGradient(lvl.start.x, lvl.start.y, 2, lvl.start.x, lvl.start.y, 14);
            startGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
            startGrad.addColorStop(0.8, 'rgba(255,255,255,0.4)');
            startGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = startGrad;
            ctx.beginPath(); ctx.arc(lvl.start.x, lvl.start.y, 14, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.arc(lvl.start.x, lvl.start.y, 4, 0, Math.PI * 2); ctx.fill();
        }

        // Draw Hole with inset depth shadow
        let holeGrad = ctx.createRadialGradient(hole.x, hole.y, Math.max(1, hole.r * 0.2), hole.x, hole.y, hole.r);
        holeGrad.addColorStop(0, '#000000');
        holeGrad.addColorStop(0.8, '#1a2614');
        holeGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = holeGrad;
        ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();

        // Draw Flag
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(hole.x - 1.5, hole.y - 35, 3, 35);
        ctx.fillStyle = '#e62e2e';
        ctx.beginPath();
        ctx.moveTo(hole.x + 1.5, hole.y - 35);
        ctx.lineTo(hole.x + 18, hole.y - 25);
        ctx.lineTo(hole.x + 1.5, hole.y - 15);
        ctx.fill();

        // Draw Ball shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
        ctx.beginPath(); ctx.arc(ball.x + 3, ball.y + 4, ball.r, 0, Math.PI * 2); ctx.fill();
        
        // Draw Ball
        let ballGrad = ctx.createRadialGradient(ball.x - ball.r*0.3, ball.y - ball.r*0.3, Math.max(0.1, ball.r*0.1), ball.x, ball.y, ball.r);
        ballGrad.addColorStop(0, '#ffffff');
        let ballColor = (gameMode === 'tournament2p' && currentPlayer === 1) ? '#b0d4ff' : '#e0e0e0';
        ballGrad.addColorStop(0.7, ballColor);
        ballGrad.addColorStop(1, '#888888');
        ctx.fillStyle = ballGrad;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();

        if (isAiming) {
            let dx = aimStart.x - aimCurrent.x;
            let dy = aimStart.y - aimCurrent.y;
            if (invertAim) { dx = -dx; dy = -dy; }

            ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + dx, ball.y + dy);
            
            const force = Math.sqrt(dx*dx + dy*dy) * powerMultiplier;
            if (force > maxPower) {
                ctx.strokeStyle = '#ff4444';
                const scaleFactor = (maxPower/powerMultiplier) / Math.sqrt(dx*dx+dy*dy);
                ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + dx*scaleFactor, ball.y + dy*scaleFactor);
            } else if (force > maxPower * 0.6) { ctx.strokeStyle = '#ffaa00'; } 
            else { ctx.strokeStyle = '#ffffff'; }
            ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
        }
    }

    ctx.restore();
}

function loop() {
    updatePhysics();
    draw();
    requestAnimationFrame(loop);
}

// UI Binders
document.querySelectorAll('.diff-sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-sel-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.diff;
        loadCustomLevelsAndInit();
        updateHighscoreUI();
    });
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;
        document.getElementById('level-select-container').style.display = (gameMode === 'training') ? 'block' : 'none';
        document.getElementById('tournament-select-container').style.display = (gameMode !== 'training') ? 'block' : 'none';
    });
});

document.getElementById('start-game-btn').addEventListener('click', () => {
    setupScreen.classList.add('hidden');
    p1Scores = []; p2Scores = [];
    p1Times = []; p2Times = [];
    
    if (gameMode === 'training') {
        let lv = parseInt(document.getElementById('level-select').value);
        // Training uses allAvailableLevels
        playingLevels = allAvailableLevels;
        customLevelNames = [...allAvailableNames];
        startLevel(lv, 1);
    } else {
        // Check if custom tournament selected
        let tSel = document.getElementById('custom-tournament-select');
        let tIdx = tSel ? tSel.value : '';
        if (tIdx !== '' && tIdx !== null) {
            let tournaments = getCustomTournaments();
            let t = tournaments[parseInt(tIdx)];
            if (t) {
                playingLevels = t.levelIndices.map(i => JSON.parse(JSON.stringify(allAvailableLevels[i])));
                customLevelNames = t.levelIndices.map(i => allAvailableNames[i]);
            } else {
                const bl = getBaseLevels();
                playingLevels = JSON.parse(JSON.stringify(bl));
                customLevelNames = bl.map((l, i) => l.name || `Level ${i+1}`);
            }
        } else {
            const bl = getBaseLevels();
            playingLevels = JSON.parse(JSON.stringify(bl));
            customLevelNames = bl.map((l, i) => l.name || `Level ${i+1}`);
        }
        startLevel(0, 1);
    }
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    levelOverScreen.classList.add('hidden');
    if (gameMode === 'training') {
        setupScreen.classList.remove('hidden');
    } else if (gameMode === 'tournament1p') {
        startLevel(currentLevelIdx + 1, 1);
    }
});

document.getElementById('ready-btn').addEventListener('click', () => {
    playerTurnScreen.classList.add('hidden');
    if (document.getElementById('next-player-name').textContent === "Spieler 2") startLevel(currentLevelIdx, 2);
    else startLevel(currentLevelIdx + 1, 1);
});

document.getElementById('reset-ball-btn').addEventListener('click', () => {
    if (isPopupVisible() && !isEditorMode) return;
    resetBall(1);
});

document.getElementById('invert-aim-btn').addEventListener('click', () => {
    invertAim = !invertAim;
    document.getElementById('invert-aim-btn').style.background = invertAim ? 'rgba(255,255,255,0.4)': 'rgba(0,0,0,0.3)';
});

// Editor Binders
document.getElementById('open-editor-btn').addEventListener('click', () => {
    setupScreen.classList.add('hidden');
    editorScreen.classList.remove('hidden');
    isEditorMode = true;
    resizeCanvas();
    let oldWalls = currentEnv.walls, oldSand = currentEnv.sand, oldWater = currentEnv.water;
    currentEnv.walls = editorWalls; currentEnv.sand = editorSand; currentEnv.water = editorWater;
    centerCamera();
    currentEnv.walls = oldWalls; currentEnv.sand = oldSand; currentEnv.water = oldWater;
});

document.getElementById('editor-close-btn').addEventListener('click', () => {
    editorScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    isEditorMode = false;
    loadCustomLevelsAndInit();
});

document.querySelectorAll('.editor-tool').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.editor-tool').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        editorTool = btn.dataset.tool;
    });
});

document.getElementById('editor-clear-btn').addEventListener('click', () => {
    editorWalls = []; editorSand = []; editorWater = [];
});

document.getElementById('editor-test-btn').addEventListener('click', () => {
    isEditorMode = false;
    editorScreen.classList.add('hidden');
    
    currentEnv.walls = editorWalls;
    currentEnv.sand = editorSand;
    currentEnv.water = editorWater;
    hole.x = editorHole.x; hole.y = editorHole.y; hole.r = 14;
    
    // Simulate playing this as a custom volatile level
    gameMode = 'training';
    playingLevels.push({ start: editorStart, hole: editorHole, walls: editorWalls, sand: editorSand, water: editorWater });
    startLevel(playingLevels.length - 1, 1);
    
    // Once finished (training mode ends), show Editor again instead of Setup
    const oldListener = document.getElementById('next-level-btn').onclick;
    document.getElementById('next-level-btn').onclick = (e) => {
        levelOverScreen.classList.add('hidden');
        editorScreen.classList.remove('hidden');
        isEditorMode = true;
        playingLevels.pop(); // remove volatile test level
        document.getElementById('next-level-btn').onclick = oldListener; // restore
    }
});

function getEditorJSON() {
    let levelName = document.getElementById('editor-level-name').value.trim();
    return JSON.stringify({ name: levelName, start: editorStart, hole: editorHole, walls: editorWalls, sand: editorSand, water: editorWater });
}

document.getElementById('editor-export-btn').addEventListener('click', async () => {
    const json = getEditorJSON();
    try {
        await navigator.clipboard.writeText(json);
        alert("Level-Code in die Zwischenablage kopiert!");
    } catch(err) {
        console.error("Clipboard API failed: ", err);
        prompt("Kopiere diesen Code:", json);
    }
});

document.getElementById('editor-save-btn').addEventListener('click', () => {
    let name = document.getElementById('editor-level-name').value.trim();
    if (!name) { alert("Bitte vergib einen Level-Namen!"); return; }
    
    let saved = JSON.parse(localStorage.getItem('minigolf-custom-levels') || '[]');
    // Check if replacing
    let index = saved.findIndex(l => l.name === name);
    let levelPacket = { name: name, data: JSON.parse(getEditorJSON()) };
    if (index >= 0) saved[index] = levelPacket;
    else saved.push(levelPacket);
    
    localStorage.setItem('minigolf-custom-levels', JSON.stringify(saved));
    loadCustomLevelsAndInit();
    alert(`${name} wurde lokal gespeichert!`);
});

document.getElementById('editor-load-select').addEventListener('change', (e) => {
    let idx = parseInt(e.target.value);
    if (isNaN(idx) || idx < 0 || idx >= allAvailableLevels.length) return;
    
    let lvl = JSON.parse(JSON.stringify(allAvailableLevels[idx]));
    editorWalls = lvl.walls || [];
    editorSand = lvl.sand || [];
    editorWater = lvl.water || [];
    if (lvl.start) editorStart = { x: lvl.start.x, y: lvl.start.y };
    if (lvl.hole) editorHole = { x: lvl.hole.x, y: lvl.hole.y };
    
    // Recenter using the loaded level's bounds (walls + sand + water + start + hole)
    resizeCanvas();
    let oldWalls = currentEnv.walls, oldSand = currentEnv.sand, oldWater = currentEnv.water;
    currentEnv.walls = editorWalls; currentEnv.sand = editorSand; currentEnv.water = editorWater;
    centerCamera();
    currentEnv.walls = oldWalls; currentEnv.sand = oldSand; currentEnv.water = oldWater;
    
    // Set the input field name
    let rawName = allAvailableNames[idx].replace(' ✏️', '');
    document.getElementById('editor-level-name').value = rawName;
    
    e.target.value = ""; // reset user selection visually
});

// Tournament Builder Logic
let tournamentBuilderIndices = [];

function renderTournamentBuilderList() {
    const list = document.getElementById('tournament-builder-list');
    if (tournamentBuilderIndices.length === 0) {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.4); font-size: 0.8rem; text-align: center; padding: 0.5rem;">Noch keine Level hinzugefügt.</p>';
        return;
    }
    list.innerHTML = '';
    tournamentBuilderIndices.forEach((lvlIdx, pos) => {
        let row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.2);border-radius:6px;margin-bottom:0.3rem;';
        let name = allAvailableNames[lvlIdx] || `Level ${lvlIdx + 1}`;
        row.innerHTML = `<span style="color:#eee;font-size:0.8rem;">${pos + 1}. ${name}</span>
            <div style="display:flex;gap:0.3rem;">
                ${pos > 0 ? `<button class="tb-up" data-pos="${pos}" style="background:rgba(255,255,255,0.15);border:none;color:#fff;padding:0.15rem 0.4rem;border-radius:4px;cursor:pointer;font-size:0.75rem;">▲</button>` : ''}
                ${pos < tournamentBuilderIndices.length - 1 ? `<button class="tb-down" data-pos="${pos}" style="background:rgba(255,255,255,0.15);border:none;color:#fff;padding:0.15rem 0.4rem;border-radius:4px;cursor:pointer;font-size:0.75rem;">▼</button>` : ''}
                <button class="tb-remove" data-pos="${pos}" style="background:rgba(200,50,50,0.6);border:none;color:#fff;padding:0.15rem 0.4rem;border-radius:4px;cursor:pointer;font-size:0.75rem;">✕</button>
            </div>`;
        list.appendChild(row);
    });
    list.querySelectorAll('.tb-up').forEach(b => b.addEventListener('click', () => {
        let p = parseInt(b.dataset.pos);
        [tournamentBuilderIndices[p-1], tournamentBuilderIndices[p]] = [tournamentBuilderIndices[p], tournamentBuilderIndices[p-1]];
        renderTournamentBuilderList();
    }));
    list.querySelectorAll('.tb-down').forEach(b => b.addEventListener('click', () => {
        let p = parseInt(b.dataset.pos);
        [tournamentBuilderIndices[p], tournamentBuilderIndices[p+1]] = [tournamentBuilderIndices[p+1], tournamentBuilderIndices[p]];
        renderTournamentBuilderList();
    }));
    list.querySelectorAll('.tb-remove').forEach(b => b.addEventListener('click', () => {
        tournamentBuilderIndices.splice(parseInt(b.dataset.pos), 1);
        renderTournamentBuilderList();
    }));
}

document.getElementById('open-tournament-builder-btn').addEventListener('click', () => {
    tournamentBuilderIndices = [];
    document.getElementById('tournament-builder-name').value = '';
    // Populate level dropdown
    let sel = document.getElementById('tournament-builder-level-select');
    sel.innerHTML = '';
    allAvailableLevels.forEach((l, i) => {
        let opt = document.createElement('option');
        opt.value = i;
        opt.textContent = allAvailableNames[i];
        sel.appendChild(opt);
    });
    renderTournamentBuilderList();
    document.getElementById('tournament-builder-screen').classList.remove('hidden');
});

document.getElementById('tournament-builder-add-btn').addEventListener('click', () => {
    let sel = document.getElementById('tournament-builder-level-select');
    let idx = parseInt(sel.value);
    if (!isNaN(idx)) {
        tournamentBuilderIndices.push(idx);
        renderTournamentBuilderList();
    }
});

document.getElementById('tournament-builder-save-btn').addEventListener('click', () => {
    let name = document.getElementById('tournament-builder-name').value.trim();
    if (!name) { alert('Bitte einen Turniernamen eingeben!'); return; }
    if (tournamentBuilderIndices.length < 2) { alert('Mindestens 2 Level benötigt!'); return; }
    
    let tournaments = getCustomTournaments();
    let existing = tournaments.findIndex(t => t.name === name);
    let entry = { name, levelIndices: [...tournamentBuilderIndices] };
    if (existing >= 0) tournaments[existing] = entry;
    else tournaments.push(entry);
    
    localStorage.setItem('minigolf-custom-tournaments', JSON.stringify(tournaments));
    loadCustomLevelsAndInit();
    document.getElementById('tournament-builder-screen').classList.add('hidden');
    
    // Auto-select the new tournament
    let sel = document.getElementById('custom-tournament-select');
    let newIdx = getCustomTournaments().findIndex(t => t.name === name);
    if (newIdx >= 0) sel.value = newIdx;
});

document.getElementById('tournament-builder-cancel-btn').addEventListener('click', () => {
    document.getElementById('tournament-builder-screen').classList.add('hidden');
});

// Bootup
loadCustomLevelsAndInit();
updateHighscoreUI();
requestAnimationFrame(loop);
