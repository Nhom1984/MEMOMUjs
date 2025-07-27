/* MEMOMU FULL GAME: Menu, Music Memory, Memory Classic, MEMOMU Memory, MONLUCK, BATTLE
   Copyright 2025 Nhom1984
   All assets should be in /assets/ folder.
   Canvas ID must be "gameCanvas", size 800x700.
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let assets = { images: {}, sounds: {} };

// --- ASSET LOADING ---
function loadImage(name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => { assets.images[name] = img; resolve(); };
    img.onerror = () => resolve();
  });
}
function loadSound(name, src) {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    assets.sounds[name] = audio;
    resolve();
  });
}

// --- FILES TO LOAD ---
const imageFiles = [
  { name: "memomu", src: "assets/MEMOMU1.png" },
  { name: "monad", src: "assets/monad.png" },
  { name: "sound", src: "assets/sound.png" },
];

for (let i = 1; i <= 18; i++) imageFiles.push({ name: `img${i}`, src: `assets/image${i}.png` });
for (let i = 1; i <= 6; i++) imageFiles.push({ name: `memimg${i}`, src: `assets/image${i}.png` });
// Add all images for upgraded Classic Memory (image1-33 + monad)
for (let i = 1; i <= 33; i++) imageFiles.push({ name: `classicimg${i}`, src: `assets/image${i}.png` });
imageFiles.push({ name: `classicmonad`, src: `assets/monad.png` });
for (let i = 1; i <= 30; i++) imageFiles.push({ name: `mmimg${i}`, src: `assets/image${(i % 12) + 1}.png` });
for (let i = 1; i <= 13; i++) imageFiles.push({ name: `avatar${i}`, src: `assets/image${i}.png` }); // battle avatars
for (let i = 14; i <= 33; i++) imageFiles.push({ name: `battle${i}`, src: `assets/image${i}.png` }); // battle grid images
const soundFiles = [
  { name: "yupi", src: "assets/yupi.mp3" },
  { name: "kuku", src: "assets/kuku.mp3" },
  { name: "buuuu", src: "assets/buuuu.mp3" },
  { name: "music", src: "assets/MEMOMU.mp3" }
];

// Add note sound files for Music Memory mode
for (let i = 1; i <= 8; i++) {
  soundFiles.push({ name: `note${i}`, src: `assets/note${i}.mp3` });
}

async function loadAssets() {
  let promises = [];
  for (let file of imageFiles) promises.push(loadImage(file.name, file.src));
  for (let file of soundFiles) promises.push(loadSound(file.name, file.src));
  await Promise.all(promises);
}

// --- BUTTONS ---
class Button {
  constructor(label, x, y, w = 280, h = 56, img = null) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img; // new: optional image name
  }
  draw() {
    ctx.save();
    if (!this.img) {
      ctx.strokeStyle = "#ff69b4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, 16);
      ctx.fillStyle = "#ffb6c1";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#222";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label, this.x, this.y);
    } else {
      // Only draw the image, no border/fill
      if (assets.images[this.img]) {
        ctx.drawImage(assets.images[this.img], this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
      }
    }
    ctx.restore();
  }
  isInside(mx, my) {
    return mx >= this.x - this.w / 2 && mx <= this.x + this.w / 2 &&
      my >= this.y - this.h / 2 && my <= this.y + this.h / 2;
  }
}

// --- GAME STATE ---
let gameState = "loading"; // loading, menu, mode, musicmem_rules, musicmem, memory_menu, memory_classic_rules, memory_classic, memory_memomu_rules, memory_memomu, monluck, battle
let menuButtons = [], modeButtons = [], musicMemRulesButtons = [], musicMemButtons = [], memoryMenuButtons = [], memoryClassicRulesButtons = [], memoryClassicButtons = [], memoryMemomuRulesButtons = [], memoryMemomuButtons = [], memoryMemomuScoreButtons = [], monluckButtons = [], battleButtons = [];
let soundOn = true;

// --- GAME OVER OVERLAY ---
let gameOverOverlay = {
  active: false,
  mode: "", // which game mode triggered the overlay
  finalScore: 0,
  buttons: []
};

// --- HIGH SCORE SYSTEM ---
let highScores = {
  musicMemory: [],
  memoryClassic: [],
  memoryMemomu: [],
  monluck: [],
  battle: []
};

// --- MUSIC MEMORY MODE DATA ---
let musicMem = {
  grid: [],
  sequence: [],
  userSequence: [],
  currentRound: 1,
  maxRounds: 10,
  playingMelody: false,
  allowInput: false,
  score: 0,
  feedback: "",
  tiles: [],
  showRoundSplash: true,
  splashTimer: 0,
  splashMsg: "",

  // New 3-phase structure
  phase: "memory", // memory, deception, guessing
  imageAssignments: {}, // maps image indices (1-18) to note numbers (1-8)
  assignedImages: [], // the 8 images selected for this game
  decoyImages: [], // unused images for decoy tiles
  memorySequence: [], // correct sequence from memory phase
  deceptionSequence: [], // wrong sequence for deception phase
  phaseTimer: 0,
  phaseStartTime: 0,
  timeLimit: 0,
  showPhaseMessage: false,
  phaseMessage: "",
  phaseMessageTimer: 0,
  gameStarted: false
};

// --- CLASSIC MEMORY MODE DATA ---
let memoryGame = {
  grid: [],
  revealed: [],
  matched: [],
  firstIdx: null,
  secondIdx: null,
  lock: false,
  pairsFound: 0,
  attempts: 0,
  feedback: "",
  showSplash: true,
  splashTimer: 40,
  splashMsg: "Classic Memory",
  score: 0,

  // New upgraded Classic Memory features
  currentRound: 1,
  maxRounds: 5,
  roundScores: [], // Store score for each round
  timer: 0,
  roundStartTime: 0,
  timeRemaining: 30,
  showRules: true,
  gameCompleted: false,
  allImages: [], // All available images for pairs
  roundPairCount: 0
};

// --- MEMOMU MEMORY MODE DATA ---
let memomuGame = {
  grid: [],
  flashSeq: [],
  found: [],
  clicksUsed: 0,
  allowedClicks: 0,
  showSplash: true,
  splashTimer: 45,
  splashMsg: "MEMOMU Memory",
  round: 1,
  score: 0,
  timer: 0,
  timeLimit: 0,
  timeStarted: 0,
  phase: "show", // show, guess, done
  feedback: "",
  maxRounds: 10,
  roundScores: [], // Track score for each round
  gameCompleted: false,
  showScoreTable: false,
  showGo: false // For GO button after rules
};

// --- MONLUCK MODE DATA ---
let monluckGame = {
  grid: [],
  gridImages: [], // Array of image names for each tile
  monadIndices: [],
  found: [],
  clicks: 0,
  showSplash: true,
  splashTimer: 40,
  splashMsg: "MONLUCK",
  finished: false,
  result: "",
  score: 0,
  wager: 10
};

// --- BATTLE MODE DATA ---
const battleNames = [
  "molandak", "moyaki", "lyraffe", "chog", "skrumpey", "spiky nad", "potato",
  "mouch", "lazy", "retard", "bobr kurwa", "baba", "DAK"
];
let battleGame = {
  state: "rules", // rules, choose, vs, end
  phase: "ready", // ready, flash, click, result, countdown
  round: 0,
  player: null,
  opponent: null,
  grid: [],
  gridAI: [],
  targets: [],
  aiTargets: [],
  clicks: [],
  aiClicks: [],
  playerTime: null,
  aiTime: null,
  pscore: 0,
  oscore: 0,
  avatarsThisRound: 0,
  pscoreRounds: [],
  oscoreRounds: [],
  anim: 0,
  flashing: false,
  lastResult: "",
  resultText: "",
  finished: false,
  chooseRects: [],
  aiResult: null,
};

// --- GRID/TILE HELPERS ---
function createGrid(rows, cols, tileSize = 105, gap = 12, startY = 180) {
  let tiles = [];
  let startX = WIDTH / 2 - ((cols * tileSize + (cols - 1) * gap) / 2);
  let idx = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        x: startX + c * (tileSize + gap),
        y: startY + r * (tileSize + gap),
        size: tileSize,
        idx: idx,
        selected: false,
        highlight: false,
        revealed: false,
        feedback: null
      });
      idx++;
    }
  }
  return tiles;
}

// --- FISHER-YATES SHUFFLE FUNCTION ---
function fisherYatesShuffle(array) {
  const shuffled = [...array]; // Create a copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- HIGH SCORE MANAGEMENT ---
function loadHighScores() {
  try {
    const saved = localStorage.getItem('memomu_highscores');
    if (saved) {
      highScores = JSON.parse(saved);
    }
  } catch (e) {
    console.log('Could not load high scores:', e);
  }
  // Ensure all categories exist
  if (!highScores.musicMemory) highScores.musicMemory = [];
  if (!highScores.memoryClassic) highScores.memoryClassic = [];
  if (!highScores.memoryMemomu) highScores.memoryMemomu = [];
  if (!highScores.monluck) highScores.monluck = [];
  if (!highScores.battle) highScores.battle = [];
}

function saveHighScores() {
  try {
    localStorage.setItem('memomu_highscores', JSON.stringify(highScores));
  } catch (e) {
    console.log('Could not save high scores:', e);
  }
}

function addHighScore(mode, score) {
  const timestamp = new Date().toISOString();
  const entry = { score, timestamp };

  if (!highScores[mode]) highScores[mode] = [];
  highScores[mode].push(entry);

  // Sort by score (descending) and keep top 10
  highScores[mode].sort((a, b) => b.score - a.score);
  highScores[mode] = highScores[mode].slice(0, 10);

  saveHighScores();
}

function getTopScore(mode) {
  if (!highScores[mode] || highScores[mode].length === 0) return 0;
  return highScores[mode][0].score;
}

// --- GAME OVER OVERLAY FUNCTIONS ---
function showGameOverOverlay(mode, finalScore) {
  gameOverOverlay.active = true;
  gameOverOverlay.mode = mode;
  gameOverOverlay.finalScore = finalScore;

  // Add to high scores
  addHighScore(mode, finalScore);

  // Setup overlay buttons
  gameOverOverlay.buttons = [
    new Button("PLAY AGAIN", WIDTH / 2 - 120, HEIGHT / 2 + 80, 200, 50),
    new Button("QUIT", WIDTH / 2 + 120, HEIGHT / 2 + 80, 200, 50)
  ];
}

function hideGameOverOverlay() {
  gameOverOverlay.active = false;
  gameOverOverlay.mode = "";
  gameOverOverlay.finalScore = 0;
  gameOverOverlay.buttons = [];
}

function drawGameOverOverlay() {
  if (!gameOverOverlay.active) return;


  // Main container
  ctx.fillStyle = "#ffb6c1";
  ctx.strokeStyle = "#ff1493";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(WIDTH / 2 - 250, HEIGHT / 2 - 150, 500, 300, 20);
  ctx.fill();
  ctx.stroke();

  // Game Over text
  ctx.font = "48px Arial";
  ctx.fillStyle = "#8b0000";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER!", WIDTH / 2, HEIGHT / 2 - 80);

  // Final score
  ctx.font = "32px Arial";
  ctx.fillStyle = "#000";
  ctx.fillText("Final Score: " + gameOverOverlay.finalScore, WIDTH / 2, HEIGHT / 2 - 30);

  // High score info
  const topScore = getTopScore(gameOverOverlay.mode);
  if (gameOverOverlay.finalScore === topScore && topScore > 0) {
    ctx.font = "24px Arial";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("🏆 NEW HIGH SCORE! 🏆", WIDTH / 2, HEIGHT / 2 + 10);
  } else if (topScore > 0) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#4b0082";
    ctx.fillText("Best: " + topScore, WIDTH / 2, HEIGHT / 2 + 10);
  }

  // Draw buttons
  gameOverOverlay.buttons.forEach(b => b.draw());

  ctx.restore();
}

function handleGameOverOverlayClick(mx, my) {
  if (!gameOverOverlay.active) return false;

  for (let button of gameOverOverlay.buttons) {
    if (button.isInside(mx, my)) {
      if (button.label === "PLAY AGAIN") {
        hideGameOverOverlay();
        restartCurrentGame();
      } else if (button.label === "QUIT") {
        hideGameOverOverlay();
        gameState = "menu";
      }
      return true;
    }
  }
  return true; // Block all other clicks when overlay is active
}

function restartCurrentGame() {
  switch (gameOverOverlay.mode) {
    case "musicMemory":
      startMusicMemoryGame();
      break;
    case "memoryClassic":
      startMemoryGameClassic();
      break;
    case "memoryMemomu":
      startMemoryGameMemomu();
      break;
    case "monluck":
      startMonluckGame();
      break;
    case "battle":
      resetBattleGame();
      break;
  }
}

// --- GAME OVER FUNCTIONS FOR EACH MODE ---
function endMusicMemRound() {
  musicMem.allowInput = false;
  musicMem.feedback = "Game Over!";
  showGameOverOverlay("musicMemory", musicMem.score);
}

function endMusicMemoryGame() {
  musicMem.gameOver = true;
  showGameOverOverlay("musicMemory", musicMem.score);
}

function endMemoryClassicGame() {
  showGameOverOverlay("memoryClassic", memoryGame.score);
}

function endMemoryMemomuGame() {
  showGameOverOverlay("memoryMemomu", memomuGame.score);
}

function endMonluckGame() {
  showGameOverOverlay("monluck", monluckGame.score);
}

function endBattleGame() {
  showGameOverOverlay("battle", battleGame.pscore);
}

// --- BUTTONS SETUP ---
function setupButtons() {
  menuButtons = [
    new Button("NEW GAME", WIDTH / 2, 425, 240, 70),
    new Button("", WIDTH - 100, 55, 55, 44, "sound"),
    new Button("QUIT", WIDTH / 2, 504, 150, 60),
  ];
  let modeY = 295 + 85;
  let modeGap = 60;
  modeButtons = [
    new Button("MUSIC MEMORY", WIDTH / 2, modeY, 280, 50),
    new Button("MEMORY", WIDTH / 2, modeY + modeGap, 200, 50),
    new Button("MONLUCK", WIDTH / 2, modeY + modeGap * 2, 200, 50),
    new Button("BATTLE", WIDTH / 2, modeY + modeGap * 3, 200, 50),
    new Button("", WIDTH - 100, 55, 55, 44, "sound"),
    new Button("BACK", WIDTH / 2, modeY + modeGap * 4, 150, 50)
  ];
  musicMemRulesButtons = [
    new Button("Got it!", WIDTH / 2 - 100, HEIGHT - 80, 180, 50),
    new Button("MENU", WIDTH / 2 + 100, HEIGHT - 80, 180, 50)
  ];
  musicMemButtons = [
    new Button("START", WIDTH / 2, HEIGHT - 100, 180, 48),
    new Button("QUIT", WIDTH / 2, HEIGHT - 50, 180, 48)
  ];
  let memY = 300;
  memoryMenuButtons = [
    new Button("CLASSIC", WIDTH / 2, memY, 320, 56),
    new Button("MEMOMU", WIDTH / 2, memY + 80, 320, 56),
    new Button("BACK", WIDTH / 2, memY + 160, 320, 56)
  ];
  memoryClassicRulesButtons = [
    new Button("GOT IT", WIDTH / 2, HEIGHT - 100, 200, 60)
  ];
  memoryClassicButtons = [
    new Button("QUIT", WIDTH / 2, HEIGHT - 60, 150, 48)
  ];
  memoryMemomuRulesButtons = [
    new Button("GOT IT", WIDTH / 2, HEIGHT - 100, 200, 60)
  ];
  memoryMemomuButtons = [
    new Button("GO!", WIDTH / 2, HEIGHT - 300, 120, 60),
    new Button("QUIT", WIDTH / 2, HEIGHT - 45, 120, 48)
  ];
  memoryMemomuScoreButtons = [
    new Button("AGAIN", WIDTH / 2 - 90, HEIGHT - 70, 150, 48),
    new Button("MENU", WIDTH / 2 + 90, HEIGHT - 70, 150, 48),
    new Button("QUIT", WIDTH / 2, HEIGHT - 20, 130, 40)
  ];
  monluckButtons = [
    new Button("AGAIN", WIDTH / 2 - 190, HEIGHT - 60, 160, 48),
    new Button("MENU", WIDTH / 2, HEIGHT - 60, 160, 48),
    new Button("QUIT", WIDTH / 2 + 190, HEIGHT - 10, 160, 48)
  ];
  battleButtons = [
    new Button("GOT IT", WIDTH / 2, 600, 170, 60),
    new Button("GO!", WIDTH / 2, 610, 170, 60),
    new Button("BACK", WIDTH / 2, 400, 170, 60),
    new Button("QUIT", WIDTH / 2, 650, 170, 45),
    new Button("MENU", WIDTH / 2, HEIGHT - 60, 180, 48)
  ];
}

// --- MUSIC MEMORY LOGIC ---
function startMusicMemoryGame() {
  musicMem.currentRound = 1;
  musicMem.score = 0;
  musicMem.showRoundSplash = true;
  musicMem.splashTimer = 30;
  musicMem.splashMsg = "Round 1";
  musicMem.gameStarted = false;
  musicMem.phase = "memory";

  // Create random image-to-note assignments (8 images from 1-18)
  setupImageAssignments();
  setupMusicMemRound();
}

function setupImageAssignments() {
  // Select 8 random images from 1-18
  let allImages = [];
  for (let i = 1; i <= 18; i++) {
    allImages.push(i);
  }

  // Shuffle and pick 8 using Fisher-Yates algorithm
  allImages = fisherYatesShuffle(allImages);
  musicMem.assignedImages = allImages.slice(0, 8);

  // Create assignments mapping each selected image to a note (1-8)
  musicMem.imageAssignments = {};
  for (let i = 0; i < 8; i++) {
    musicMem.imageAssignments[musicMem.assignedImages[i]] = i + 1;
  }

  // Store remaining images for decoys
  musicMem.decoyImages = allImages.slice(8);
}

function setupMusicMemRound() {
  musicMem.grid = createGrid(3, 4, 115, 28, 140);

  // Determine how many images for this round
  let imageCount = getRoundImageCount(musicMem.currentRound);
  let repetitions = getRoundRepetitions(musicMem.currentRound);

  // Create memory sequence (using assigned images)
  musicMem.memorySequence = [];
  for (let i = 0; i < imageCount; i++) {
    let imgIdx = musicMem.assignedImages[i % musicMem.assignedImages.length];
    musicMem.memorySequence.push(imgIdx);
  }

  // Create deception sequence (different order of same images) using Fisher-Yates
  musicMem.deceptionSequence = fisherYatesShuffle([...musicMem.memorySequence]);

  // Fill grid: place assigned images + fill remaining with decoys
  fillGridForRound();

  musicMem.userSequence = [];
  musicMem.playingMelody = false;
  musicMem.allowInput = false;
  musicMem.feedback = "";
  musicMem.phaseTimer = 0;
  musicMem.timeLimit = getRoundTimeLimit(musicMem.currentRound);
}

function getRoundImageCount(round) {
  if (round === 1) return 3;
  if (round >= 2 && round <= 3) return 4;
  if (round >= 4 && round <= 7) return 5;
  if (round === 8) return 6;
  if (round === 9) return 7;
  if (round === 10) return 8;
  return 3;
}

function getRoundRepetitions(round) {
  if (round >= 1 && round <= 3) return 1; // EASY
  if (round >= 4 && round <= 7) return 2; // MEDIUM
  if (round >= 8 && round <= 10) return 3; // PRO
  return 1;
}

function getRoundTimeLimit(round) {
  if (round >= 1 && round <= 3) return 10; // 10s for rounds 1-3
  if (round >= 4 && round <= 7) return 15; // 15s for rounds 4-7
  if (round >= 8 && round <= 10) return 20; // 20s for rounds 8-10
  return 10;
}

function fillGridForRound() {
  let imageCount = getRoundImageCount(musicMem.currentRound);
  let usedImages = musicMem.memorySequence.slice(0, imageCount);

  // Clear grid image assignments
  musicMem.grid.forEach(tile => {
    tile.imageIdx = null;
    tile.isDecoy = true;
    tile.revealed = false;
    tile.selected = false;
    tile.highlight = false;
  });

  // Place the required images randomly in grid
  let availablePositions = [...Array(12).keys()];

  for (let imgIdx of usedImages) {
    let pos = availablePositions.splice(Math.floor(Math.random() * availablePositions.length), 1)[0];
    musicMem.grid[pos].imageIdx = imgIdx;
    musicMem.grid[pos].isDecoy = false;
  }

  // Fill remaining positions with random decoy images
  for (let pos of availablePositions) {
    let decoyIdx = musicMem.decoyImages[Math.floor(Math.random() * musicMem.decoyImages.length)];
    musicMem.grid[pos].imageIdx = decoyIdx; // <-- THIS LINE ENSURES ALL TILES HAVE IMAGES
    musicMem.grid[pos].isDecoy = true;
  }
}

function startMemoryPhase() {
  musicMem.gameStarted = true;
  musicMem.phase = "memory";
  musicMem.showPhaseMessage = true;
  musicMem.phaseMessage = "Listen carefully and remember";
  musicMem.phaseMessageTimer = 60; // 2 seconds
  musicMem.phaseTimer = 0;

  setTimeout(() => {
    playMemorySequence();
  }, 2000);
}

function playMemorySequence() {
  musicMem.playingMelody = true;
  musicMem.allowInput = false;

  let repetitions = getRoundRepetitions(musicMem.currentRound);
  let sequence = [];

  // Repeat the memory sequence based on difficulty
  for (let r = 0; r < repetitions; r++) {
    sequence = sequence.concat(musicMem.memorySequence);
  }

  let i = 0;
  function playStep() {
    if (i < sequence.length) {
      let imgIdx = sequence[i];

      // Find and highlight the tile with this image
      for (let tile of musicMem.grid) {
        if (tile.imageIdx === imgIdx && !tile.isDecoy) {
          tile.highlight = true;
          tile.revealed = true;
          break;
        }
      }

      drawMusicMemory();

      // Play the note sound for this image
      let noteNum = musicMem.imageAssignments[imgIdx];
      let sfx = assets.sounds[`note${noteNum}`];
      if (soundOn && sfx) {
        try { sfx.currentTime = 0; sfx.play(); } catch (e) { }
      }

      setTimeout(() => {
        // Turn off highlight
        for (let tile of musicMem.grid) {
          tile.highlight = false;
          tile.revealed = false;
        }
        drawMusicMemory();
        i++;
        setTimeout(playStep, 300);
      }, 500);
    } else {
      musicMem.playingMelody = false;
      setTimeout(() => startDeceptionPhase(), 1000);
    }
  }
  playStep();
}

function startDeceptionPhase() {
  musicMem.phase = "deception";
  musicMem.showPhaseMessage = true;
  musicMem.phaseMessage = "Don't get yourself fooled";
  musicMem.phaseMessageTimer = 60; // 2 seconds

  setTimeout(() => {
    playDeceptionSequence();
  }, 2000);
}

function playDeceptionSequence() {
  let repetitions = getRoundRepetitions(musicMem.currentRound);
  let sequence = [];

  // Repeat the deception sequence based on difficulty
  for (let r = 0; r < repetitions; r++) {
    sequence = sequence.concat(musicMem.deceptionSequence);
  }

  let i = 0;
  function playStep() {
    if (i < sequence.length) {
      let imgIdx = sequence[i];

      // Find and highlight the tile with this image (might be in different position)
      for (let tile of musicMem.grid) {
        if (tile.imageIdx === imgIdx && !tile.isDecoy) {
          tile.highlight = true;
          tile.revealed = true;
          break;
        }
      }

      drawMusicMemory();

      // Play a different note or same note for deception
      let noteNum = musicMem.imageAssignments[imgIdx];
      let sfx = assets.sounds[`note${noteNum}`];
      if (soundOn && sfx) {
        try { sfx.currentTime = 0; sfx.play(); } catch (e) { }
      }

      setTimeout(() => {
        // Turn off highlight
        for (let tile of musicMem.grid) {
          tile.highlight = false;
          tile.revealed = false;
        }
        drawMusicMemory();
        i++;
        setTimeout(playStep, 300);
      }, 500);
    } else {
      setTimeout(() => startGuessingPhase(), 1000);
    }
  }
  playStep();
}

function startGuessingPhase() {
  musicMem.phase = "guessing";
  musicMem.showPhaseMessage = true;
  musicMem.phaseMessage = "Now play!";
  musicMem.phaseMessageTimer = 60; // 2 seconds
  musicMem.allowInput = true;
  musicMem.userSequence = [];
  musicMem.phaseStartTime = performance.now() / 1000;

  // Reveal all tiles
  musicMem.grid.forEach(tile => {
    tile.revealed = true;
    tile.selected = false;
  });
  musicMem.grid.forEach((tile, idx) => {
    if (!tile.imageIdx) {
      console.warn(`Tile ${idx + 1} is missing imageIdx in guessing phase.`);
    }
  });

  drawMusicMemory();
}

function handleMusicMemTileClick(tileIdx) {
  if (!musicMem.allowInput || musicMem.phase !== "guessing") return;

  let tile = musicMem.grid[tileIdx - 1];
  if (!tile || tile.selected) return;

  tile.selected = true;

  // Check if this is a decoy tile
  if (tile.isDecoy) {
    // Wrong click - end round immediately
    let sfx = assets.sounds["buuuu"];
    if (soundOn && sfx) {
      try { sfx.currentTime = 0; sfx.play(); } catch (e) { }
    }

    musicMem.feedback = "Wrong! Round ended.";
    musicMem.allowInput = false;

    setTimeout(() => endMusicMemRound(), 1500);
    drawMusicMemory();
    return;
  }
  if (tile.revealed && tile.imageIdx) {
    let img = assets.images["img" + tile.imageIdx];
    if (!img) {
      console.warn(`Missing image for img${tile.imageIdx}`);
    }
  }

  musicMem.userSequence.push(tile.imageIdx);

  // Check if this click is in the right order
  let expectedImg = musicMem.memorySequence[musicMem.userSequence.length - 1];
  if (tile.imageIdx !== expectedImg) {
    // Wrong order - end round immediately
    let sfx = assets.sounds["buuuu"];
    if (soundOn && sfx) {
      try { sfx.currentTime = 0; sfx.play(); } catch (e) { }
    }

    musicMem.feedback = "Wrong order! Round ended.";
    musicMem.allowInput = false;

    setTimeout(() => endMusicMemRound(), 1500);
    drawMusicMemory();
    return;
  }

  // Correct click
  let noteNum = musicMem.imageAssignments[tile.imageIdx];
  let sfx = assets.sounds[`note${noteNum}`];
  if (soundOn && sfx) {
    try { sfx.currentTime = 0; sfx.play(); } catch (e) { }
  }

  musicMem.score += 1; // +1 point per correct hit

  // Check if round is complete
  if (musicMem.userSequence.length === musicMem.memorySequence.length) {
    // Perfect round!
    let bonusPoints = musicMem.memorySequence.length;
    musicMem.score += bonusPoints;

    let sfx = assets.sounds["yupi"];
    if (soundOn && sfx) {
      try { sfx.currentTime = 0; sfx.play(); } catch (e) { }
    }

    musicMem.feedback = `Perfect! +${bonusPoints} bonus points`;
    musicMem.allowInput = false;

    setTimeout(() => nextMusicMemRound(), 1500);
  }

  drawMusicMemory();
}

// --- CLASSIC MEMORY MODE LOGIC ---
// Helper functions for upgraded Classic Memory
function getClassicRoundGrid(round) {
  switch (round) {
    case 1: return { rows: 3, cols: 4, pairs: 6 };
    case 2: return { rows: 4, cols: 4, pairs: 8 };
    case 3: return { rows: 4, cols: 5, pairs: 10 };
    case 4: return { rows: 5, cols: 5, pairs: 12 }; // 25 tiles, 12 pairs + 1 extra
    case 5: return { rows: 5, cols: 6, pairs: 15 };
    default: return { rows: 3, cols: 4, pairs: 6 };
  }
}

function initializeClassicMemoryUpgraded() {
  memoryGame.currentRound = 1;
  memoryGame.maxRounds = 5;
  memoryGame.roundScores = [];
  memoryGame.score = 0;
  memoryGame.showRules = true;
  memoryGame.gameCompleted = false;

  // Prepare all available images (1-33 + monad = 34 total)
  memoryGame.allImages = [];
  for (let i = 1; i <= 33; i++) {
    memoryGame.allImages.push(i);
  }
  memoryGame.allImages.push('monad');
}

function setupClassicRound(round) {
  let gridConfig = getClassicRoundGrid(round);
  memoryGame.grid = createGrid(gridConfig.rows, gridConfig.cols, 80, 8, 160);

  let totalTiles = gridConfig.rows * gridConfig.cols;
  memoryGame.roundPairCount = gridConfig.pairs;

  // Select random images for pairs using Fisher-Yates shuffle
  let shuffledImages = fisherYatesShuffle(memoryGame.allImages);
  let selectedImages = shuffledImages.slice(0, gridConfig.pairs);

  // Create pairs array
  let pairIds = [];
  selectedImages.forEach(img => {
    pairIds.push(img);
    pairIds.push(img);
  });

  // For odd number of tiles (round 4), add one extra image
  if (totalTiles % 2 === 1) {
    let extraImage = shuffledImages[gridConfig.pairs];
    pairIds.push(extraImage);
  }

  // Shuffle the pairs using Fisher-Yates algorithm
  pairIds = fisherYatesShuffle(pairIds);

  memoryGame.pairIds = pairIds;
  memoryGame.revealed = Array(totalTiles).fill(false);
  memoryGame.matched = Array(totalTiles).fill(false);
  memoryGame.firstIdx = null;
  memoryGame.secondIdx = null;
  memoryGame.lock = false;
  memoryGame.pairsFound = 0;
  memoryGame.attempts = 0;
  memoryGame.feedback = "";
  memoryGame.showSplash = true;
  memoryGame.splashTimer = 40;
  memoryGame.splashMsg = `Round ${round}`;
  memoryGame.roundStartTime = performance.now();
  memoryGame.timeRemaining = 30;
}

function startMemoryGameClassic() {
  initializeClassicMemoryUpgraded();
  gameState = "memory_classic_rules";
}

function startClassicRound() {
  setupClassicRound(memoryGame.currentRound);
  gameState = "memory_classic";
}

function nextClassicRound() {
  memoryGame.currentRound++;
  if (memoryGame.currentRound <= memoryGame.maxRounds) {
    startClassicRound();
  } else {
    // Should not reach here as endClassicRound handles game completion
    endMemoryClassicGame();
  }
}

function calculateRoundScore(timeUsed) {
  let baseScore = memoryGame.pairsFound; // 1 point per pair
  let timeBonus = Math.max(0, 30 - timeUsed); // seconds under 30
  let multiplier = memoryGame.currentRound; // round number as multiplier
  return baseScore + (timeBonus * multiplier);
}

function endClassicRound() {
  let timeUsed = (performance.now() - memoryGame.roundStartTime) / 1000;
  let roundScore = calculateRoundScore(timeUsed);
  memoryGame.roundScores.push(roundScore);
  memoryGame.score += roundScore;

  if (memoryGame.currentRound < memoryGame.maxRounds) {
    memoryGame.feedback = `Round ${memoryGame.currentRound} Complete! +${roundScore} points`;
    setTimeout(() => {
      nextClassicRound();
    }, 2000);
  } else {
    // Game completed after 5 rounds - show game over overlay
    memoryGame.feedback = `Game Complete! Final Score: ${memoryGame.score}`;
    setTimeout(() => {
      endMemoryClassicGame();
    }, 2000);
  }
}

// --- MEMOMU MEMORY MODE LOGIC ---
function startMemoryGameMemomu() {
  memomuGame.round = 1;
  memomuGame.score = 0;
  memomuGame.roundScores = [];
  memomuGame.gameCompleted = false;
  memomuGame.showScoreTable = false;
  memomuGame.showSplash = true;
  memomuGame.splashTimer = 45;
  memomuGame.splashMsg = "Round 1";
  setupMemoryMemomuRound();
}
function setupMemoryMemomuRound() {
  // 6 columns × 5 rows grid
  memomuGame.grid = createGrid(5, 6, 85, 10, 125);
  let n = memomuGame.round;
  memomuGame.flashSeq = [];
  let allIdx = Array.from({ length: 30 }, (_, i) => i);
  let chosen = [];
  while (chosen.length < n) {
    let idx = allIdx[Math.floor(Math.random() * allIdx.length)];
    if (!chosen.includes(idx)) chosen.push(idx);
  }
  memomuGame.flashSeq = chosen;
  memomuGame.found = [];
  memomuGame.clicksUsed = 0;
  memomuGame.allowedClicks = n + 1; // N+1 clicks allowed

  // Calculate time limit: Round 1 = 3s, Round 2+ = N + 2*(N-1)
  if (n === 1) {
    memomuGame.timeLimit = 3;
  } else {
    memomuGame.timeLimit = n + 2 * (n - 1);
  }

  memomuGame.timer = 0;
  memomuGame.timeStarted = 0;
  memomuGame.phase = "show";
  memomuGame.feedback = "";
}

// --- MONLUCK LOGIC ---
function startMonluckGame() {
  monluckGame.grid = createGrid(5, 6, 85, 10, 125);

  // Initialize all tiles as not revealed
  monluckGame.grid.forEach(tile => {
    tile.revealed = false;
  });

  // Create an array of 30 images: 5 monad.png and 25 random images from image1-image33
  monluckGame.gridImages = [];

  // Choose 5 random positions for the monads
  let allPositions = Array.from({ length: 30 }, (_, i) => i);
  let shuffledPositions = fisherYatesShuffle(allPositions);
  monluckGame.monadIndices = shuffledPositions.slice(0, 5);

  // Fill the grid with images
  for (let i = 0; i < 30; i++) {
    if (monluckGame.monadIndices.includes(i)) {
      monluckGame.gridImages[i] = "monad"; // This will be the monad image
    } else {
      // Use random images from image1-image33
      let randomImageIndex = Math.floor(Math.random() * 33) + 1;
      monluckGame.gridImages[i] = "classicimg" + randomImageIndex;
    }
  }

  monluckGame.found = [];
  monluckGame.clicks = 0;
  monluckGame.finished = false;
  monluckGame.result = "";
  monluckGame.score = 0;
  monluckGame.showSplash = true;
  monluckGame.splashTimer = 40;
  monluckGame.splashMsg = "MONLUCK";
}

// --- BATTLE LOGIC ---
function resetBattleGame() {
  battleGame.state = "rules";
  battleGame.phase = "ready";
  battleGame.round = 0;
  battleGame.pscore = 0;
  battleGame.oscore = 0;
  battleGame.pscoreRounds = [];
  battleGame.oscoreRounds = [];
  battleGame.player = null;
  battleGame.opponent = null;
  battleGame.grid = [];
  battleGame.gridAI = [];
  battleGame.targets = [];
  battleGame.aiTargets = [];
  battleGame.clicks = [];
  battleGame.aiClicks = [];
  battleGame.playerTime = null;
  battleGame.aiTime = null;
  battleGame.avatarsThisRound = 0;
  battleGame.anim = 0;
  battleGame.flashing = false;
  battleGame.lastResult = "";
  battleGame.resultText = "";
  battleGame.finished = false;
  battleGame.chooseRects = [];
  battleGame.aiResult = null;
}
function prepareBattleRound() {
  const avatars = Math.floor(Math.random() * 5) + 1;
  battleGame.avatarsThisRound = avatars;
  [battleGame.grid, battleGame.targets] = makeBattleGrid(battleGame.player, avatars, battleGame.round);
  [battleGame.gridAI, battleGame.aiTargets] = makeBattleGrid(battleGame.opponent, avatars, battleGame.round);
  battleGame.clicks = [];
  battleGame.aiClicks = [];
  battleGame.playerTime = null;
  battleGame.aiTime = null;
  battleGame.phase = "flash";
  battleGame.flashing = true;
  battleGame.anim = performance.now() / 1000;
  battleGame.resultText = "";
  battleGame.aiResult = null;
}
function makeBattleGrid(avatarIdx, avatars, roundIdx) {
  let grid = Array(16).fill(null);
  let avatar_pos = [];
  while (avatar_pos.length < avatars) {
    let idx = Math.floor(Math.random() * 16);
    if (!avatar_pos.includes(idx)) avatar_pos.push(idx);
  }
  for (const i of avatar_pos) grid[i] = assets.images[`avatar${avatarIdx + 1}`];
  if (roundIdx < 2) {
    for (let i = 0; i < 16; i++) if (grid[i] == null) grid[i] = null;
    return [grid, avatar_pos];
  } else {
    let pool = [];
    for (let i = 14; i <= 33; i++) pool.push(i);
    let imgs_needed = 16 - avatars;
    let imgs = [];
    while (imgs.length < imgs_needed) {
      pool = fisherYatesShuffle(pool);
      imgs = imgs.concat(pool.slice(0, Math.min(imgs_needed - imgs.length, pool.length)));
    }
    let img_ptr = 0;
    for (let i = 0; i < 16; i++) {
      if (grid[i] == null) {
        if (img_ptr >= imgs.length) img_ptr = 0;
        grid[i] = assets.images[`battle${imgs[img_ptr]}`];
        img_ptr++;
      }
    }
    return [grid, avatar_pos];
  }
}
function aiPlay() {
  let ai_delay_per_tile = Math.random() * 0.6 + 0.5;
  let total_time = ai_delay_per_tile * battleGame.avatarsThisRound + Math.random();
  return [battleGame.aiTargets.slice(), total_time];
}
function sorted(arr) { return arr.slice().sort((a, b) => a - b).join(","); }
function makeBattleResultText(mistake) {
  const player_hits = battleGame.clicks.filter(i => battleGame.targets.includes(i)).length;
  const ai_hits = battleGame.aiTargets.length;
  const player_all = sorted(battleGame.clicks) == sorted(battleGame.targets);
  const ai_time_val = battleGame.aiTime || 999;
  const player_faster = player_all && battleGame.playerTime < ai_time_val;
  let msg = "";
  if (mistake) {
    msg = `YOU LOSE ROUND! You got ${player_hits} pts, Opponent ${ai_hits} pts`;
    battleGame.pscore += player_hits;
    battleGame.oscore += ai_hits + 1;
  } else if (player_all && player_faster) {
    msg = `YOU WIN ROUND! ${battleGame.avatarsThisRound} pts +1 speed +1 win`;
    battleGame.pscore += battleGame.avatarsThisRound + 2;
    battleGame.oscore += ai_hits;
  } else if (player_all) {
    msg = `YOU FINISHED! ${battleGame.avatarsThisRound} pts`;
    battleGame.pscore += battleGame.avatarsThisRound;
    battleGame.oscore += ai_hits + 1;
  }
  return msg;
}
function processBattleResult() {
  if (!battleGame.resultText) {
    battleGame.resultText = makeBattleResultText(sorted(battleGame.clicks) != sorted(battleGame.targets));
  }
  battleGame.phase = "result";
  battleGame.anim = performance.now() / 1000;
  battleGame.aiResult = null;
}
function nextBattleRoundOrEnd() {
  battleGame.round++;
  if (battleGame.round >= 5) {
    battleGame.state = "end";
    battleGame.phase = "end";
  } else {
    // Subsequent rounds start immediately after previous round's summary
    battleGame.phase = "flash";
    battleGame.flashing = true;
    battleGame.anim = performance.now() / 1000;
    prepareBattleRound();
    battleGame.resultText = "";
    battleGame.playerTime = null;
  }
}

// --- DRAW FUNCTIONS ---
function drawMenu() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  let img = assets.images["memomu"];
  if (img) ctx.drawImage(img, WIDTH / 2 - 275, 50, 550, 275);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  menuButtons.forEach(b => b.draw());
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}
function drawModeMenu() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  let img = assets.images["memomu"];
  if (img) ctx.drawImage(img, WIDTH / 2 - 275, 50, 550, 275);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "44px Arial";
  ctx.textAlign = "center";
  modeButtons.forEach(b => b.draw());
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}
function drawMemoryMenu() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#836EF9";
  ctx.font = "44px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Choose Memory Mode", WIDTH / 2, 140);
  memoryMenuButtons.forEach(b => b.draw());
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}
function drawMusicMemoryRules() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = "#836EF9";
  ctx.font = "44px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Music Memory Rules", WIDTH / 2, 60);

  // Large light pink table
  const tableX = 50;
  const tableY = 100;
  const tableW = WIDTH - 100;
  const tableH = HEIGHT - 200;

  // Table background
  ctx.fillStyle = "#ffb6c1";
  ctx.strokeStyle = "#ff69b4";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(tableX, tableY, tableW, tableH, 12);
  ctx.fill();
  ctx.stroke();

  // Rules text
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";

  const rules = [
    "Game has 10 rounds. Each round has 3 phases:",
    "• Memory phase: Remember the right order and faces of images.",
    "• Deceptive phase: Game will show deceiving order and images to fool you.",
    "• Guessing phase: Click right images in right order.",
    "",
    "• Every right hit image gives you 1 point.",
    "• If round is perfect, get additional X points, where X is the number of images",
    "  shown in that round.",
    "• If player hits a wrong image or clicks in the wrong order, the round ends",
    "  immediately.",
    "",
    "Difficulty Levels:",
    "• Rounds 1-3 (EASY): Images appear only once in each phase.",
    "• Rounds 4-7 (MEDIUM): Images appear twice in each phase.",
    "• Rounds 8-10 (PRO): Images appear thrice in each phase.",
    "",
    "Time Limits: 10s (rounds 1-3), 15s (rounds 4-7), 20s (rounds 8-10)"
  ];

  let y = tableY + 40;
  for (let rule of rules) {
    ctx.fillText(rule, tableX + 20, y);
    y += 28;
  }

  // Draw buttons
  musicMemRulesButtons.forEach(b => b.draw());

  // Copyright
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}

function drawMusicMemory() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";

  // Round and phase info
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Round " + musicMem.currentRound + " / " + musicMem.maxRounds, WIDTH / 10, 70);

  // Phase indicator
  let phaseText = "";
  if (musicMem.phase === "memory") phaseText = "MEMORY PHASE";
  else if (musicMem.phase === "deception") phaseText = "DECEPTION PHASE";
  else if (musicMem.phase === "guessing") phaseText = "GUESSING PHASE";

  ctx.font = "24px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText(phaseText, WIDTH - 150, 70);

  // Timer for guessing phase
  if (musicMem.phase === "guessing" && musicMem.allowInput) {
    let elapsed = performance.now() / 1000 - musicMem.phaseStartTime;
    let remaining = Math.max(0, musicMem.timeLimit - elapsed);
    ctx.font = "28px Arial";
    ctx.fillStyle = remaining < 3 ? "#ff0000" : "#ffb6c1";
    ctx.fillText("Time: " + Math.ceil(remaining), WIDTH / 2, 120);

    // End round if time runs out
    if (remaining <= 0 && musicMem.allowInput) {
      musicMem.allowInput = false;
      musicMem.feedback = "Time's up!";
      setTimeout(() => endMusicMemRound(), 1500);
    }
  }

  // Draw grid
  musicMem.grid.forEach(tile => {
    ctx.save();

    // Only show images when revealed
    if (tile.revealed && tile.imageIdx) {
      let img = assets.images["img" + tile.imageIdx];
      if (img) ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
      else {
        ctx.fillStyle = "#333";
        ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
      }
    } else {
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
    }

    // Border styling
    if (tile.highlight) {
      ctx.strokeStyle = "#ff69b4";
      ctx.lineWidth = 6;
    }
    else if (tile.selected) {
      ctx.strokeStyle = "#00f2ff";
      ctx.lineWidth = 4;
    }
    else {
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 2;
    }
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });

  // Draw buttons based on game state
  if (!musicMem.gameStarted && !musicMem.showRoundSplash) {
    musicMemButtons.forEach(b => b.draw());
  } else if (musicMem.gameStarted && musicMem.phase === "guessing") {
    // Only show QUIT button during gameplay
    musicMemButtons[1].draw();
  }

  // Feedback text
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(musicMem.feedback, WIDTH / 2, HEIGHT - 120);

  // Score
  ctx.font = "21px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText("Score: " + musicMem.score, WIDTH / 11, HEIGHT - 600);

  // Phase message overlay
  if (musicMem.showPhaseMessage) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.font = "36px Arial";
    ctx.fillStyle = "#ff69b4";
    ctx.textAlign = "center";
    ctx.fillText(musicMem.phaseMessage, WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }

  // Round splash
  if (musicMem.showRoundSplash) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "54px Arial";
    ctx.fillStyle = "#ff69b4";
    ctx.textAlign = "center";
    ctx.fillText(musicMem.splashMsg, WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }

  // Copyright
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}

// --- UPGRADED CLASSIC MEMORY DRAWING FUNCTIONS ---
function drawMemoryClassicRules() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Light pink background
  ctx.fillStyle = "#ffb6c1";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Rules table
  ctx.fillStyle = "#836EF9";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Classic Memory Rules", WIDTH / 2, 100);

  ctx.fillStyle = "#333";
  ctx.font = "24px Arial";
  ctx.fillText("FIND PAIRS", WIDTH / 2, 180);

  ctx.font = "20px Arial";
  ctx.fillText("You have 5 rounds with progressive grid,", WIDTH / 2, 250);
  ctx.fillText("Your best score goes for leaderboard,", WIDTH / 2, 280);
  ctx.fillText("Top 5 shares memomu treasure at the end of the week.", WIDTH / 2, 310);

  ctx.font = "24px Arial";
  ctx.fillText("Scoring:", WIDTH / 2, 400);
  ctx.font = "20px Arial";
  ctx.fillText("1 point per pair + (seconds under 30) × round number", WIDTH / 2, 430);
  ctx.fillText("Each round: 30 seconds maximum", WIDTH / 2, 460);

  memoryClassicRulesButtons.forEach(b => b.draw());

  // Copyright
  ctx.font = "16px Arial";
  ctx.fillStyle = "#666";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 20, HEIGHT - 15);
}

// --- MEMOMU MEMORY RULES DRAWING FUNCTION ---
function drawMemomuMemoryRules() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Light pink background
  ctx.fillStyle = "#ffb6c1";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Rules table
  ctx.fillStyle = "#ff69b4";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MEMOMU Memory Rules", WIDTH / 2, 90);

  ctx.fillStyle = "#333";
  ctx.font = "22px Arial";
  ctx.fillText("Find all images that appears on the grid", WIDTH / 2, 140);

  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  let startX = 80;
  let startY = 180;
  let lineHeight = 28;

  const rules = [
    "• Every round progressive number of images will appear on the screen",
    "• You have to find them all to progress to the next round",
    "• Each round you have number of images shown + one, clicks",
    "• Order doesnt matter",
    "",
    "Scoring:",
    "  - Perfect round (all found, no extra clicks): Round number + time bonus",
    "  - Non-perfect (all found, but extra clicks): Advance, no bonus",
    "",
    "Game ends if time runs out or you fail to find all images within allowed clicks"
  ];

  for (let i = 0; i < rules.length; i++) {
    ctx.fillText(rules[i], startX, startY + i * lineHeight);
  }

  memoryMemomuRulesButtons.forEach(b => b.draw());

  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}

function drawMemoryGameClassic() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Update timer
  if (!memoryGame.showSplash && !memoryGame.lock) {
    let elapsed = (performance.now() - memoryGame.roundStartTime) / 1000;
    memoryGame.timeRemaining = Math.max(0, 30 - elapsed);

    // Check if time's up
    if (memoryGame.timeRemaining <= 0 && memoryGame.pairsFound < memoryGame.roundPairCount) {
      endClassicRound();
    }
  }

  // Round and score display at top left (like Music Memory)
  ctx.fillStyle = "#ff69b4";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Round: ${memoryGame.currentRound}/${memoryGame.maxRounds}`, 20, 40);
  ctx.fillText(`Score: ${memoryGame.score}`, 20, 70);

  // Timer with color coding (red when < 5 seconds)
  ctx.fillStyle = memoryGame.timeRemaining < 5 ? "#ff0000" : "#ff69b4";
  ctx.fillText(`Time: ${Math.ceil(memoryGame.timeRemaining)}s`, 20, 100);

  // Reset color for title
  ctx.fillStyle = "#836EF9";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Classic Memory", WIDTH / 2, 50);

  // Pairs progress
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Pairs: ${memoryGame.pairsFound} / ${memoryGame.roundPairCount}`, WIDTH / 2, 120);

  // Draw tiles
  memoryGame.grid.forEach((tile, i) => {
    ctx.save();
    let isRevealed = memoryGame.revealed[i] || memoryGame.matched[i];

    // Get the correct image
    let pairId = memoryGame.pairIds[i];
    let imgName = pairId === 'monad' ? 'classicmonad' : `classicimg${pairId}`;
    let img = assets.images[imgName];

    if (isRevealed && img) {
      // Show the image directly (no question marks in upgraded mode)
      ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    } else {
      // Show blank tile (no question marks)
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
    }

    // Tile borders
    if (memoryGame.matched[i]) {
      ctx.strokeStyle = "#00f2ff";
      ctx.lineWidth = 4;
    } else if (isRevealed) {
      ctx.strokeStyle = "#ff69b4";
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 2;
    }
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });

  // Buttons (only QUIT)
  memoryClassicButtons.forEach(b => b.draw());

  // Feedback
  ctx.font = "24px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(memoryGame.feedback, WIDTH / 2, HEIGHT - 120);

  // Round splash
  if (memoryGame.showSplash) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "54px Arial";
    ctx.fillStyle = "#ff69b4";
    ctx.textAlign = "center";
    ctx.fillText(memoryGame.splashMsg, WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }

  // Copyright
  ctx.font = "16px Arial";
  ctx.fillStyle = "#666";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 20, HEIGHT - 15);

  // Draw game over overlay if active
  drawGameOverOverlay();
}
// Draw score table for Memomu game
function drawMemomuScoreTable() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#836EF9";
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MEMOMU Memory - Final Score", WIDTH / 2, 60);

  // Score table
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  let startY = 120;
  ctx.fillText("Round | Score | Perfect | Completed", WIDTH / 2, startY);

  for (let i = 0; i < memomuGame.roundScores.length; i++) {
    let round = memomuGame.roundScores[i];
    let statusText = round.completed ? (round.perfect ? "Perfect" : "Complete") : "Failed";
    ctx.fillText(`${round.round} | ${round.score} | ${round.perfect ? "YES" : "NO"} | ${statusText}`, WIDTH / 2, startY + 30 + (i * 25));
  }

  ctx.font = "28px Arial";
  ctx.fillStyle = "#ffd700";
  ctx.fillText(`Total Score: ${memomuGame.score}`, WIDTH / 2, startY + 50 + (memomuGame.roundScores.length * 25));

  memoryMemomuScoreButtons.forEach(b => b.draw());
}
function drawMemoryGameMemomu() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = "#836EF9";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MEMOMU Memory", WIDTH / 2, 90);

  // Show GO button if needed
  if (memomuGame.showGo) {
    ctx.font = "32px Arial";
    ctx.fillStyle = "#333";
    ctx.fillText("Click GO to start the game!", WIDTH / 2, HEIGHT / 2);
    memoryMemomuButtons.forEach(b => b.draw());
    return;
  }

  // Game UI - Top left area for round, score, timer
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText("Round: " + memomuGame.round + " / " + memomuGame.maxRounds, 20, 50);
  ctx.fillText("Score: " + memomuGame.score, 20, 75);

  // Timer
  if (memomuGame.phase === "guess") {
    memomuGame.timer = (performance.now() / 1000) - memomuGame.timeStarted;
    let timeLeft = Math.max(0, memomuGame.timeLimit - memomuGame.timer);

    // Check if time is up
    if (timeLeft <= 0 && memomuGame.phase === "guess") {
      // Time's up - end the round as failed
      memomuGame.phase = "done";
      let pts = memomuGame.found.length;
      memomuGame.score += pts;
      memomuGame.roundScores.push({
        round: memomuGame.round,
        score: pts,
        perfect: false,
        completed: false
      });
      memomuGame.feedback = `Time's up! Found ${memomuGame.found.length}/${memomuGame.flashSeq.length}. Game Over!`;

      setTimeout(() => {
        memomuGame.gameCompleted = true;
        memomuGame.showScoreTable = true;
        gameState = "memory_memomu_score";
      }, 2000);
    }

    ctx.fillStyle = timeLeft <= 3 ? "#ff0000" : "#fff";
    ctx.fillText("Time: " + Math.ceil(timeLeft) + "s", 20, 100);
  }

  // Grid
  memomuGame.grid.forEach((tile, i) => {
    ctx.save();
    let img = assets.images["mmimg" + (i + 1)];
    if (tile.revealed && img) {
      ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    } else {
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
    }
    ctx.strokeStyle = tile.feedback ? tile.feedback : "#262626";
    ctx.lineWidth = tile.feedback ? 5 : 2;
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });

  // Phase indicator and feedback
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  if (memomuGame.phase === "show") {
    ctx.fillText("Watch the sequence...", WIDTH / 2, HEIGHT - 80);
  } else if (memomuGame.phase === "guess") {
    ctx.fillText(`Find ${memomuGame.flashSeq.length} images! (${memomuGame.clicksUsed}/${memomuGame.allowedClicks} clicks)`, WIDTH / 2, HEIGHT - 80);
  }

  // Feedback
  ctx.font = "20px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText(memomuGame.feedback, WIDTH / 2, HEIGHT - 80);

  // QUIT button always at bottom
  memoryMemomuButtons[1].draw();

  // Splash screen
  if (memomuGame.showSplash) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "54px Arial";
    ctx.fillStyle = "#ff69b4";
    ctx.textAlign = "center";
    ctx.fillText(memomuGame.splashMsg, WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }

  // Copyright
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}
function drawMonluckGame() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#836EF9";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MONLUCK", WIDTH / 2, 90);

  // Don't show score counter during gameplay - only in game over overlay

  monluckGame.grid.forEach((tile, i) => {
    ctx.save();
    let imgName = monluckGame.gridImages[i];
    let img = assets.images[imgName];

    // Calculate row and column for MON LUCK text display
    const cols = 6;
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Display "MON LUCK" text on specific tiles
    let displayText = "";
    if (row === 1) { // Row 2 (0-indexed)
      if (col === 1) displayText = "M"; // 2nd tile
      else if (col === 2) displayText = "O"; // 3rd tile
      else if (col === 3) displayText = "N"; // 4th tile
    } else if (row === 2) { // Row 3 (0-indexed)
      if (col === 2) displayText = "L"; // 3rd tile
      else if (col === 3) displayText = "U"; // 4th tile
      else if (col === 4) displayText = "C"; // 5th tile
      else if (col === 5) displayText = "K"; // 6th tile
    }

    // Only show the image if the tile has been revealed (clicked)
    if (tile.revealed && img) {
      ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    } else if (!tile.revealed) {
      // Show blank tile when not revealed
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
    }

    // Apply highlight if tile was clicked
    if (tile.revealed) {
      if (monluckGame.monadIndices.includes(i)) {
        ctx.strokeStyle = "#00ff00"; // Green highlight for monad
        ctx.lineWidth = 5;
      } else {
        ctx.strokeStyle = "#ff0000"; // Red highlight for non-monad
        ctx.lineWidth = 5;
      }
    } else {
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 2;
    }

    // Draw MON LUCK text over the tile if this tile should display it AND the tile hasn't been revealed
    if (displayText && !tile.revealed) {
      // Fill entire tile background for letters
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);

      // Make letters large and fill the tile using color #836EF9
      ctx.font = "48px Arial";
      ctx.fillStyle = "#836EF9";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Draw stroke for better visibility
      ctx.strokeText(displayText, tile.x + tile.size / 2, tile.y + tile.size / 2);
      // Draw filled text
      ctx.fillText(displayText, tile.x + tile.size / 2, tile.y + tile.size / 2);
    }

    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });

  // Show progress during gameplay
  if (!monluckGame.finished && !monluckGame.showSplash) {
    ctx.font = "24px Arial";
    ctx.fillStyle = "#836EF9";
    ctx.textAlign = "center";
    ctx.fillText(`Found: ${monluckGame.found.length}/5 monads`, WIDTH / 2, HEIGHT - 80);
  }

  // Only show QUIT button during gameplay, positioned centrally at bottom
  if (!monluckGame.finished && !monluckGame.showSplash) {
    let quitButton = new Button("QUIT", WIDTH / 2, HEIGHT - 48, 160, 48);
    quitButton.draw();
  }

  // Show AGAIN and MENU buttons only when finished (on score table)
  if (monluckGame.finished && !monluckGame.showSplash) {
    let againButton = new Button("AGAIN", WIDTH / 2 - 100, HEIGHT - 60, 160, 48);
    let menuButton = new Button("MENU", WIDTH / 2 + 100, HEIGHT - 60, 160, 48);
    againButton.draw();
    menuButton.draw();
  }

  // Only show score in the result text when game is finished
  if (monluckGame.finished) {
    ctx.font = "28px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(monluckGame.result, WIDTH / 2, HEIGHT - 120);
  }

  if (monluckGame.showSplash) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "54px Arial";
    ctx.fillStyle = "#ff69b4";
    ctx.textAlign = "center";
    ctx.fillText(monluckGame.splashMsg, WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}
function drawBattleGame() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (battleGame.state === "rules") {
    ctx.fillStyle = "#222";
    ctx.fillRect(WIDTH / 2 - 340, HEIGHT / 2 - 220, 680, 380);
    ctx.fillStyle = "#ffb6c1";
    ctx.strokeStyle = "#ff69b4";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(WIDTH / 2 - 340, HEIGHT / 2 - 220, 680, 380, 24);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "38px Arial";
    ctx.fillStyle = "#836EF9";
    ctx.fillText("BATTLE MODE RULES:", WIDTH / 2, HEIGHT / 2 - 180);
    ctx.font = "24px Arial";
    ctx.fillStyle = "#222";
    const rules = [
      "- Each round both players see their avatars flash on grids",
      "- Find them all before another player - click right tiles",
      "- One mistake ends your round!",
      "",
      "Scoring:",
      "- Each avatar found you get +1pt",
      "- If you find all avatars and are faster you get +1pt bonus.",
      "- Win round (more avatars found, or all + speed): +1pt bonus",
      "- Total score after 5 rounds wins!",
    ];
    for (let i = 0; i < rules.length; i++) {
      ctx.fillText(rules[i], WIDTH / 2, HEIGHT / 2 - 130 + i * 35);
    }
    battleButtons[0].draw();
  } else if (battleGame.state === "choose") {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "42px Arial";
    ctx.fillStyle = "#836EF9";
    ctx.textAlign = "center";
    ctx.fillText("Choose your fighter!", WIDTH / 2, 60);
    let img_w = 80, img_h = 80, col1_x = WIDTH / 2 - 300, col2_x = WIDTH / 2 + 20, y_start = 90, y_gap = 44 + img_h / 2;
    battleGame.chooseRects = [];
    for (let i = 0; i < 7; i++) {
      let img = assets.images[`avatar${i + 1}`];
      let rect = { x: col1_x, y: y_start + i * y_gap, w: img_w, h: img_h };
      if (img) ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.font = "24px Arial"; ctx.fillStyle = "#ff69b4";
      ctx.fillText(battleNames[i], col1_x + img_w + 60, rect.y + img_h / 2 + 8);
      battleGame.chooseRects.push({ ...rect, idx: i });
    }
    for (let i = 0; i < 6; i++) {
      let img = assets.images[`avatar${i + 8}`];
      let rect = { x: col2_x, y: y_start + i * y_gap, w: img_w, h: img_h };
      if (img) ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.font = "24px Arial"; ctx.fillStyle = "#ff69b4";
      ctx.fillText(battleNames[i + 7], col2_x + img_w + 60, rect.y + img_h / 2 + 8);
      battleGame.chooseRects.push({ ...rect, idx: i + 7 });
    }
  } else if (battleGame.state === "vs" || battleGame.state === "fight") {
    drawBattleGrids();
  } else if (battleGame.state === "end") {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    let img_sz = 130;
    let pimg = assets.images[`avatar${battleGame.player + 1}`];
    let oimg = assets.images[`avatar${battleGame.opponent + 1}`];
    if (pimg) ctx.drawImage(pimg, 100, 60, img_sz, img_sz);
    if (oimg) ctx.drawImage(oimg, WIDTH - 230, 60, img_sz, img_sz);

    // Draw avatar names under their images
    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    if (battleGame.player !== null) {
      ctx.fillText(battleNames[battleGame.player], 100 + img_sz / 2, 60 + img_sz + 30);
    }
    if (battleGame.opponent !== null) {
      ctx.fillText(battleNames[battleGame.opponent], WIDTH - 230 + img_sz / 2, 60 + img_sz + 30);
    }

    ctx.font = "52px Arial";
    ctx.fillStyle = "#ff69b4";
    ctx.fillText("VS", WIDTH / 2, 120);
    ctx.font = "52px Arial";
    ctx.fillText(`${battleGame.pscore} : ${battleGame.oscore}`, WIDTH / 2, 200);
    let msg = battleGame.pscore > battleGame.oscore ? "YOU WIN!" : battleGame.pscore < battleGame.oscore ? "YOU LOSE!" : "DRAW!";
    let color = battleGame.pscore > battleGame.oscore ? "#00ff00" : battleGame.pscore < battleGame.oscore ? "#ff0000" : "#ffb6c1";
    ctx.font = "52px Arial"; ctx.fillStyle = color;
    ctx.fillText(msg, WIDTH / 2, 300);
    battleButtons[2].draw();
  }
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}
function drawBattleGrids() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  let img_sz = 100, grid_img_sz = 48;
  let pimg = assets.images[`avatar${battleGame.player + 1}`], oimg = assets.images[`avatar${battleGame.opponent + 1}`];
  if (pimg) ctx.drawImage(pimg, 100, 60, img_sz, img_sz);
  if (oimg) ctx.drawImage(oimg, WIDTH - 200, 60, img_sz, img_sz);
  ctx.font = "36px Arial"; ctx.fillStyle = "#ffb6c1";
  ctx.fillText("VS", WIDTH / 2, 120);
  ctx.font = "24px Arial"; ctx.fillStyle = "#ffb6c1";
  ctx.fillText(battleNames[battleGame.player], 100 + img_sz / 2 - 30, 180);
  ctx.fillText(battleNames[battleGame.opponent], WIDTH - 200 + img_sz / 2 - 30, 180);
  ctx.font = "40px Arial";
  ctx.fillText(battleGame.pscore, WIDTH / 2 - 70, 180);
  ctx.fillText(battleGame.oscore, WIDTH / 2 + 70, 180);

  let gx = 120, gy = 260, cell_sz = 56;
  for (let i = 0; i < 16; i++) {
    let x = gx + (i % 4) * cell_sz * 1.2;
    let y = gy + Math.floor(i / 4) * cell_sz * 1.2;
    ctx.save();
    ctx.fillStyle = "#ffb6c1";
    ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, cell_sz, cell_sz, 8);
    ctx.fill();
    ctx.stroke();
    let v = battleGame.grid[i];
    if (battleGame.flashing && v !== null) {
      let img = v;
      if (img) ctx.drawImage(img, x + 4, y + 4, grid_img_sz, grid_img_sz);
    }
    if (battleGame.phase === "click" && battleGame.clicks.includes(i)) {
      ctx.strokeStyle = "#00ff00"; ctx.lineWidth = 4;
      ctx.strokeRect(x + 2, y + 2, cell_sz - 4, cell_sz - 4);
    }
    ctx.restore();
  }
  let gx2 = WIDTH - 380, gy2 = 260;
  for (let i = 0; i < 16; i++) {
    let x = gx2 + (i % 4) * cell_sz * 1.2;
    let y = gy2 + Math.floor(i / 4) * cell_sz * 1.2;
    ctx.save();
    ctx.fillStyle = "#ffb6c1";
    ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, cell_sz, cell_sz, 8);
    ctx.fill();
    ctx.stroke();
    let v = battleGame.gridAI[i];
    if (battleGame.flashing && v !== null) {
      let img = v;
      if (img) ctx.drawImage(img, x + 4, y + 4, grid_img_sz, grid_img_sz);
    }
    ctx.restore();
  }
  battleButtons[3].draw();
  if (battleGame.phase === "result") {
    ctx.font = "34px Arial";
    let color = battleGame.resultText.startsWith("YOU WIN") ? "#00ff00" :
      battleGame.resultText.startsWith("YOU LOSE") ? "#ff0000" : "#ffb6c1";
    ctx.fillStyle = color;
    ctx.fillText(battleGame.resultText, WIDTH / 2, 580); // Position between grids and QUIT button
  }
  if (battleGame.phase === "ready" && battleGame.round === 0) {
    battleButtons[1].draw();
  }
  if (battleGame.phase === "click") {
    let left = Math.max(0, 15 - (performance.now() / 1000 - battleGame.anim));
    ctx.font = "24px Arial"; ctx.fillStyle = "#ff69b4";
    ctx.fillText(`Time: ${Math.floor(left)}s`, WIDTH / 2, 580); // Position between grids and QUIT button
  }
  if (battleGame.phase === "countdown") {
    let c = Math.max(0, 3 - Math.floor(performance.now() / 1000 - battleGame.anim));
    if (c > 0) {
      ctx.font = "54px Arial"; ctx.fillStyle = "#ff69b4";
      ctx.fillText(`${c}`, WIDTH / 2, 580); // Position between grids and QUIT button
    }
  }
}

// --- CLICK HANDLING ---
canvas.addEventListener("click", function (e) {
  let rect = canvas.getBoundingClientRect();
  let mx = e.clientX - rect.left;
  let my = e.clientY - rect.top;

  // Check game over overlay first - blocks all other interactions
  if (handleGameOverOverlayClick(mx, my)) {
    return;
  }

  if (gameState === "menu") {
    if (menuButtons[0].isInside(mx, my)) { gameState = "mode"; }
    else if (menuButtons[1].isInside(mx, my)) {
      soundOn = !soundOn;
      menuButtons[1].label = soundOn ? "SOUND ON" : "SOUND OFF";
      let music = assets.sounds["music"];
      if (soundOn && music) music.play();
      else if (music) music.pause();
    }
    else if (menuButtons[2].isInside(mx, my)) { window.close(); }
  } else if (gameState === "mode") {
    if (modeButtons[0].isInside(mx, my)) {
      let music = assets.sounds["music"];
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
      gameState = "musicmem_rules";
    }
    else if (modeButtons[1].isInside(mx, my)) {
      let music = assets.sounds["music"];
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
      gameState = "memory_menu";
    }
    else if (modeButtons[2].isInside(mx, my)) {
      let music = assets.sounds["music"];
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
      gameState = "monluck"; startMonluckGame();
    }
    else if (modeButtons[3].isInside(mx, my)) {
      let music = assets.sounds["music"];
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
      gameState = "battle"; resetBattleGame();
    }
    else if (modeButtons[4].isInside(mx, my)) {
      soundOn = !soundOn;
      modeButtons[4].label = soundOn ? "SOUND ON" : "SOUND OFF";
      let music = assets.sounds["music"];
      if (soundOn && music) music.play();
      else if (music) music.pause();
    }
    else if (modeButtons[5].isInside(mx, my)) { gameState = "menu"; }
  } else if (gameState === "musicmem_rules") {
    if (musicMemRulesButtons[0].isInside(mx, my)) {
      gameState = "musicmem";
      startMusicMemoryGame();
    }
    else if (musicMemRulesButtons[1].isInside(mx, my)) {
      gameState = "mode";
    }
  } else if (gameState === "musicmem") {
    if (musicMemButtons[0].isInside(mx, my)) {
      if (!musicMem.gameStarted && !musicMem.showRoundSplash) {
        startMemoryPhase();
      }
    }
    else if (musicMemButtons[1].isInside(mx, my)) { gameState = "mode"; }

    // Handle tile clicks during guessing phase
    if (musicMem.phase === "guessing" && musicMem.allowInput && !musicMem.showRoundSplash) {
      for (let tile of musicMem.grid) {
        if (
          mx >= tile.x &&
          mx <= tile.x + tile.size &&
          my >= tile.y &&
          my <= tile.y + tile.size
        ) {
          handleMusicMemTileClick(tile.idx);
          break;
        }
      }
    }
  } else if (gameState === "memory_menu") {
    if (memoryMenuButtons[0].isInside(mx, my)) { gameState = "memory_classic_rules"; startMemoryGameClassic(); }
    else if (memoryMenuButtons[1].isInside(mx, my)) { gameState = "memory_memomu_rules"; }
    else if (memoryMenuButtons[2].isInside(mx, my)) { gameState = "mode"; }
  } else if (gameState === "memory_classic_rules") {
    if (memoryClassicRulesButtons[0].isInside(mx, my)) {
      startClassicRound();
    }
  } else if (gameState === "memory_memomu_rules") {
    if (memoryMemomuRulesButtons[0].isInside(mx, my)) {
      gameState = "memory_memomu";
      memomuGame.showGo = true;
    }
  } else if (gameState === "memory_classic") {
    if (memoryClassicButtons[0].isInside(mx, my)) { gameState = "menu"; }
    if (!memoryGame.showSplash && !memoryGame.lock && memoryGame.timeRemaining > 0) {
      for (let i = 0; i < memoryGame.grid.length; i++) {
        let tile = memoryGame.grid[i];
        if (
          mx >= tile.x &&
          mx <= tile.x + tile.size &&
          my >= tile.y &&
          my <= tile.y + tile.size
        ) {
          handleMemoryTileClickClassic(i);
          drawMemoryGameClassic();
          break;
        }
      }
    }
  } else if (gameState === "memory_memomu") {
    if (memoryMemomuButtons[1].isInside(mx, my)) { gameState = "memory_menu"; }
    else if (memoryMemomuButtons[0].isInside(mx, my) && memomuGame.showGo) {
      memomuGame.showGo = false;
      startMemoryGameMemomu();
    }
    if (!memomuGame.showSplash && !memomuGame.showGo && memomuGame.phase === "guess" && memomuGame.clicksUsed < memomuGame.allowedClicks) {
      for (let i = 0; i < memomuGame.grid.length; i++) {
        let tile = memomuGame.grid[i];
        if (
          mx >= tile.x &&
          mx <= tile.x + tile.size &&
          my >= tile.y &&
          my <= tile.y + tile.size
        ) {
          handleMemoryTileClickMemomu(i);
          drawMemoryGameMemomu();
          break;
        }
      }
    }
  } else if (gameState === "monluck") {
    // Handle AGAIN and MENU buttons when game is finished
    if (monluckGame.finished && !monluckGame.showSplash) {
      let againButton = new Button("AGAIN", WIDTH / 2 - 100, HEIGHT - 60, 160, 48);
      let menuButton = new Button("MENU", WIDTH / 2 + 100, HEIGHT - 60, 160, 48);
      if (againButton.isInside(mx, my)) {
        startMonluckGame();
        drawMonluckGame();
      } else if (menuButton.isInside(mx, my)) {
        gameState = "mode";
      }
    }

    // Handle QUIT button during gameplay
    if (!monluckGame.finished && !monluckGame.showSplash) {
      let quitButton = new Button("QUIT", WIDTH / 2, HEIGHT - 60, 160, 48);
      if (quitButton.isInside(mx, my)) {
        gameState = "mode";
      }
    }

    // Handle tile clicks for gameplay
    if (!monluckGame.showSplash && !monluckGame.finished) {
      for (let i = 0; i < monluckGame.grid.length; i++) {
        let tile = monluckGame.grid[i];
        if (
          mx >= tile.x &&
          mx <= tile.x + tile.size &&
          my >= tile.y &&
          my <= tile.y + tile.size
        ) {
          handleMonluckTileClick(i);
          drawMonluckGame();
          break;
        }
      }
    }
  } else if (gameState === "memory_memomu_score") {
    if (memoryMemomuScoreButtons[0].isInside(mx, my)) {
      gameState = "memory_memomu";
      memomuGame.showGo = true;
    }
    else if (memoryMemomuScoreButtons[1].isInside(mx, my)) { gameState = "memory_menu"; }
    else if (memoryMemomuScoreButtons[2].isInside(mx, my)) { gameState = "menu"; }
  } else if (gameState === "battle") {
    handleBattleClick(mx, my);
  }
});

// --- MEMORY CLASSIC CLICK LOGIC ---
function handleMemoryTileClickClassic(idx) {
  if (memoryGame.lock || memoryGame.revealed[idx] || memoryGame.matched[idx]) return;
  if (memoryGame.timeRemaining <= 0) return; // Time's up

  memoryGame.revealed[idx] = true;
  if (memoryGame.firstIdx === null) {
    memoryGame.firstIdx = idx;
    let sfx = assets.sounds["kuku"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
  } else if (memoryGame.secondIdx === null && idx !== memoryGame.firstIdx) {
    memoryGame.secondIdx = idx;
    memoryGame.lock = true;
    memoryGame.attempts++;
    drawMemoryGameClassic();

    setTimeout(() => {
      let a = memoryGame.pairIds[memoryGame.firstIdx];
      let b = memoryGame.pairIds[memoryGame.secondIdx];

      if (a === b) {
        // Match found!
        memoryGame.matched[memoryGame.firstIdx] = true;
        memoryGame.matched[memoryGame.secondIdx] = true;
        memoryGame.pairsFound++;
        memoryGame.feedback = "Match!";
        let sfx = assets.sounds["yupi"];
        if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }

        // Check if round is complete
        if (memoryGame.pairsFound >= memoryGame.roundPairCount) {
          endClassicRound();
        }
      } else {
        // No match
        memoryGame.revealed[memoryGame.firstIdx] = false;
        memoryGame.revealed[memoryGame.secondIdx] = false;
        memoryGame.feedback = "Miss!";
        let sfx = assets.sounds["buuuu"];
        if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
      }

      memoryGame.firstIdx = null;
      memoryGame.secondIdx = null;
      memoryGame.lock = false;
      drawMemoryGameClassic();
    }, 900);
  }
}

// --- MEMOMU MEMORY CLICK LOGIC ---
function handleMemoryTileClickMemomu(idx) {
  let tile = memomuGame.grid[idx];
  if (tile.revealed) return;

  memomuGame.clicksUsed++;
  tile.revealed = true;

  if (memomuGame.flashSeq.includes(idx) && !memomuGame.found.includes(idx)) {
    // Correct image found
    memomuGame.found.push(idx);
    let sfx = assets.sounds["yupi"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#00ff00";
  } else {
    // Wrong image clicked
    let sfx = assets.sounds["kuku"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#ff0000";
  }

  // Check if round is complete
  let allFound = memomuGame.found.length === memomuGame.flashSeq.length;
  let isPerfect = allFound && memomuGame.clicksUsed === memomuGame.flashSeq.length;
  let isComplete = allFound || memomuGame.clicksUsed >= memomuGame.allowedClicks;

  if (isComplete) {
    memomuGame.phase = "done";

    let pts = 0;
    if (allFound) {
      if (isPerfect) {
        // Perfect round: round number + time bonus
        let timeLeft = Math.max(0, memomuGame.timeLimit - memomuGame.timer);
        let timeBonus = Math.floor(timeLeft);
        pts = memomuGame.round + timeBonus;
        memomuGame.feedback = `Perfect! Round ${memomuGame.round} + ${timeBonus} time bonus = ${pts} pts`;
      } else {
        // Non-perfect round: just advance, no points
        pts = 0;
        memomuGame.feedback = `Complete! Extra clicks used, no bonus. Advancing...`;
      }
    } else {
      // Failed round: 1 point per image found, game ends
      pts = memomuGame.found.length;
      memomuGame.feedback = `Failed! Found ${memomuGame.found.length}/${memomuGame.flashSeq.length}. Game Over!`;
    }

    memomuGame.score += pts;
    memomuGame.roundScores.push({
      round: memomuGame.round,
      score: pts,
      perfect: isPerfect,
      completed: allFound
    });

    setTimeout(() => {
      if (!allFound) {
        // Game over - failed round
        memomuGame.gameCompleted = true;
        memomuGame.showScoreTable = true;
        gameState = "memory_memomu_score";
      } else if (memomuGame.round >= memomuGame.maxRounds) {
        // Game completed - all rounds done
        memomuGame.gameCompleted = true;
        memomuGame.showScoreTable = true;
        gameState = "memory_memomu_score";
      } else {
        // Next round
        memomuGame.round++;
        memomuGame.showSplash = true;
        memomuGame.splashTimer = 45;
        memomuGame.splashMsg = "Round " + memomuGame.round;
        setupMemoryMemomuRound();
        drawMemoryGameMemomu();
      }
    }, 2000);
  }
}
function runMemoryMemomuFlashSequence() {
  let flashTiles = memomuGame.flashSeq.slice();

  // Reveal ALL flash tiles at once
  memomuGame.grid.forEach((t, j) => t.revealed = flashTiles.includes(j));
  drawMemoryGameMemomu();

  // Keep them revealed for the desired duration (e.g., 1200ms)
  setTimeout(() => {
    // Hide all flashed images
    memomuGame.grid.forEach((t) => t.revealed = false);

    // Start guess phase
    memomuGame.phase = "guess";
    memomuGame.clicksUsed = 0;
    memomuGame.found = [];
    memomuGame.timer = 0;
    memomuGame.timeStarted = performance.now() / 1000;
    memomuGame.grid.forEach((t) => { t.feedback = null; });
    drawMemoryGameMemomu();
  }, 1200); // adjust duration as needed
}

// --- MONLUCK CLICK LOGIC ---
function handleMonluckTileClick(idx) {
  let tile = monluckGame.grid[idx];
  if (tile.revealed || monluckGame.finished) return;

  tile.revealed = true;
  let isMonad = monluckGame.monadIndices.includes(idx);

  if (isMonad) {
    // Found a monad - success!
    monluckGame.found.push(idx);
    let sfx = assets.sounds["yupi"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#00ff00"; // Green highlight

    // Award 1 point for each monad found
    monluckGame.score = monluckGame.found.length;

    // Check if all 5 monads have been found
    if (monluckGame.found.length >= 5) {
      monluckGame.result = `YUPI! You found all ${monluckGame.found.length} monads!`;
      monluckGame.finished = true;

      // Show success message after a short delay
      setTimeout(() => {
        monluckGame.showSplash = true;
        monluckGame.splashMsg = `Victory!\nScore: ${monluckGame.score}`;
        drawMonluckGame();
      }, 1100);
    } else {
      monluckGame.result = `Found ${monluckGame.found.length}/5 monads!`;
    }
  } else {
    // Wrong tile - highlight red but continue game
    let sfx = assets.sounds["kuku"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#ff0000"; // Red highlight

    // Game continues - player can keep trying
  }
}

// --- BATTLE CLICK HANDLING ---
function handleBattleClick(mx, my) {
  if (battleGame.state === "rules") {
    if (battleButtons[0].isInside(mx, my)) {
      battleGame.state = "choose";
    }
    return;
  }
  if (battleGame.state === "choose") {
    for (const rect of battleGame.chooseRects) {
      if (mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h) {
        battleGame.player = rect.idx;
        let pool = Array.from({ length: 13 }, (_, i) => i).filter(i => i !== rect.idx);
        battleGame.opponent = pool[Math.floor(Math.random() * pool.length)];
        battleGame.round = 0;
        battleGame.pscore = 0;
        battleGame.oscore = 0;
        battleGame.state = "vs";
        battleGame.phase = "ready";
        prepareBattleRound();
        return;
      }
    }
  } else if (battleGame.state === "vs") {
    if (battleGame.phase === "ready" && battleGame.round === 0) {
      if (battleButtons[1].isInside(mx, my)) {
        // Start with countdown for the first round
        battleGame.phase = "countdown";
        battleGame.anim = performance.now() / 1000;
      }
    } else if (battleGame.phase === "click") {
      handleBattleGridClick(mx, my);
    }
    if (battleButtons[3].isInside(mx, my)) {
      battleGame.pscore = 0;
      battleGame.oscore = 99;
      battleGame.state = "end";
      battleGame.phase = "end";
    }
    if (battleGame.phase === "result") {
      if (battleButtons[3].isInside(mx, my)) {
        battleGame.pscore = 0;
        battleGame.oscore = 99;
        battleGame.state = "end";
        battleGame.phase = "end";
      }
    }
  } else if (battleGame.state === "end") {
    if (battleButtons[2].isInside(mx, my)) {
      resetBattleGame();
      gameState = "mode";
    }
  }
}
function handleBattleGridClick(mx, my) {
  let gx = 120, gy = 260, cell_sz = 56;
  for (let i = 0; i < 16; i++) {
    let x = gx + (i % 4) * cell_sz * 1.2;
    let y = gy + Math.floor(i / 4) * cell_sz * 1.2;
    if (mx >= x && mx <= x + cell_sz && my >= y && my <= y + cell_sz && !battleGame.clicks.includes(i)) {
      if (battleGame.clicks.length < battleGame.avatarsThisRound) {
        battleGame.clicks.push(i);
        if (!battleGame.targets.includes(i)) {
          battleGame.phase = "result";
          battleGame.playerTime = performance.now() / 1000 - battleGame.anim;
          battleGame.resultText = makeBattleResultText(true);
          battleGame.anim = performance.now() / 1000;
          return;
        }
        if (sorted(battleGame.clicks) == sorted(battleGame.targets)) {
          battleGame.playerTime = performance.now() / 1000 - battleGame.anim;
          battleGame.phase = "result";
          battleGame.resultText = makeBattleResultText(false);
          battleGame.anim = performance.now() / 1000;
          return;
        }
      }
    }
  }
}

function nextMusicMemRound() {
  if (musicMem.currentRound < musicMem.maxRounds) {
    musicMem.currentRound++;
    musicMem.showRoundSplash = true;
    musicMem.splashTimer = 60;
    musicMem.splashMsg = "Round " + musicMem.currentRound;
    musicMem.gameStarted = false;
    musicMem.phase = "memory";
    setupMusicMemRound();
  } else {
    musicMem.showRoundSplash = true;
    musicMem.splashTimer = 120;
    musicMem.splashMsg = "Game Over!\nFinal Score: " + musicMem.score;
    setTimeout(() => { gameState = "mode"; }, 4000);
  }
  drawMusicMemory();
}

// --- SPLASH TIMER ---
function tickSplash() {
  if (gameState === "musicmem" && musicMem.showRoundSplash) {
    if (musicMem.splashTimer > 0) musicMem.splashTimer--;
    else {
      musicMem.showRoundSplash = false;
      musicMem.feedback = "";
      drawMusicMemory();
    }
  }

  if (gameState === "musicmem" && musicMem.showPhaseMessage) {
    if (musicMem.phaseMessageTimer > 0) musicMem.phaseMessageTimer--;
    else {
      musicMem.showPhaseMessage = false;
      drawMusicMemory();
    }
  }
  if (gameState === "memory_classic" && memoryGame.showSplash) {
    if (memoryGame.splashTimer > 0) memoryGame.splashTimer--;
    else { memoryGame.showSplash = false; memoryGame.feedback = ""; drawMemoryGameClassic(); }
  }
  if (gameState === "memory_memomu" && memomuGame.showSplash) {
    if (memomuGame.splashTimer > 0) memomuGame.splashTimer--;
    else {
      memomuGame.showSplash = false; memomuGame.feedback = ""; setTimeout(runMemoryMemomuFlashSequence, 900); // 0.9 seconds delay
    }
  }
  if (gameState === "monluck" && monluckGame.showSplash) {
    if (monluckGame.splashTimer > 0) monluckGame.splashTimer--;
    else { monluckGame.showSplash = false; monluckGame.result = ""; drawMonluckGame(); }
  }
  if (gameState === "battle") {
    if (battleGame.state === "vs") {
      if (battleGame.phase === "flash" && performance.now() / 1000 - battleGame.anim > 0.9) {
        battleGame.flashing = false;
        battleGame.anim = performance.now() / 1000;
        battleGame.phase = "click";
        battleGame.clicks = [];
        battleGame.aiClicks = [];
      }
      if (battleGame.phase === "click" && battleGame.playerTime == null) {
        if (!battleGame.aiResult) {
          battleGame.aiResult = aiPlay();
          battleGame.aiClicks = battleGame.aiResult[0];
          battleGame.aiTime = battleGame.aiResult[1];
        }
        const ai_time_val = battleGame.aiTime || 999;
        if (performance.now() / 1000 - battleGame.anim >= ai_time_val) {
          processBattleResult();
        }
      }
      if (battleGame.phase === "result" && performance.now() / 1000 - battleGame.anim > 1.6) {
        nextBattleRoundOrEnd();
      }
      if (battleGame.phase === "countdown" && performance.now() / 1000 - battleGame.anim > 3) {
        battleGame.phase = "flash";
        battleGame.flashing = true;
        battleGame.anim = performance.now() / 1000;
        battleGame.clicks = [];
        battleGame.aiClicks = [];
      }
    }
  }
}

// --- MAIN DRAW LOOP ---
function draw() {
  if (gameState === "loading") {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "45px Arial";
    ctx.fillStyle = "#ffb6c1";
    ctx.textAlign = "center";
    ctx.fillText("Loading MEMOMU...", WIDTH / 2, HEIGHT / 2);
  } else if (gameState === "menu") drawMenu();
  else if (gameState === "mode") drawModeMenu();
  else if (gameState === "musicmem_rules") drawMusicMemoryRules();
  else if (gameState === "musicmem") drawMusicMemory();
  else if (gameState === "memory_menu") drawMemoryMenu();
  else if (gameState === "memory_classic_rules") drawMemoryClassicRules();
  else if (gameState === "memory_classic") drawMemoryGameClassic();
  else if (gameState === "memory_memomu_rules") drawMemomuMemoryRules();
  else if (gameState === "memory_memomu") drawMemoryGameMemomu();
  else if (gameState === "memory_memomu_score") drawMemomuScoreTable();
  else if (gameState === "monluck") drawMonluckGame();
  else if (gameState === "battle") drawBattleGame();
}

// --- GAME LOOP ---
function gameLoop() {
  draw();
  tickSplash();
  requestAnimationFrame(gameLoop);
}

// --- LOAD EVERYTHING & START ---
loadAssets().then(() => {
  gameState = "menu";
  setupButtons();
  resetBattleGame();
  loadHighScores(); // Load high scores from localStorage
  let music = assets.sounds["music"];
  if (music) { music.loop = true; music.volume = 0.55; if (soundOn) music.play(); }
});

gameLoop();
