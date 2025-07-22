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
let gameState = "loading"; // loading, menu, mode, musicmem_rules, musicmem, memory_menu, memory_classic, memory_memomu, monluck, battle
let menuButtons = [], modeButtons = [], musicMemRulesButtons = [], musicMemButtons = [], memoryMenuButtons = [], memoryClassicButtons = [], memoryMemomuButtons = [], monluckButtons = [], battleButtons = [];
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
  // New multi-round system
  currentRound: 1,
  maxRounds: 5,
  totalPairs: 0,
  startTime: 0,
  timeBonus: 0,
  roundScores: [],
  gameComplete: false,
  showRules: false,
  showHighScores: false
};

// --- MEMOMU MEMORY MODE DATA ---
let memomuGame = {
  grid: [],
  flashSeq: [],
  found: [],
  badClicks: 0,
  left: 0,
  showSplash: true,
  splashTimer: 45,
  splashMsg: "MEMOMU Memory",
  round: 1,
  score: 0,
  timer: 0,
  phase: "show", // show, guess, done
  feedback: "",
  maxRounds: 10
};

// --- MONLUCK MODE DATA ---
let monluckGame = {
  grid: [],
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

  ctx.save();
  // Semi-transparent background
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.globalAlpha = 1;

  // Main container - larger for score table
  let containerWidth = gameOverOverlay.mode === 'memoryClassic' ? 600 : 500;
  let containerHeight = gameOverOverlay.mode === 'memoryClassic' ? 450 : 300;
  ctx.fillStyle = "#ffb6c1";
  ctx.strokeStyle = "#ff1493";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(WIDTH / 2 - containerWidth/2, HEIGHT / 2 - containerHeight/2, containerWidth, containerHeight, 20);
  ctx.fill();
  ctx.stroke();

  // Game Over text
  ctx.font = "48px Arial";
  ctx.fillStyle = "#8b0000";
  ctx.textAlign = "center";
  ctx.fillText("GAME COMPLETE!", WIDTH / 2, HEIGHT / 2 - containerHeight/2 + 60);

  if (gameOverOverlay.mode === 'memoryClassic') {
    // Enhanced display for Classic Memory with round details
    ctx.font = "28px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("Final Score: " + gameOverOverlay.finalScore, WIDTH / 2, HEIGHT / 2 - containerHeight/2 + 110);
    
    // Round scores table
    ctx.font = "20px Arial";
    ctx.fillStyle = "#4b0082";
    ctx.fillText("Round Performance:", WIDTH / 2, HEIGHT / 2 - containerHeight/2 + 150);
    
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    let tableStartY = HEIGHT / 2 - containerHeight/2 + 180;
    ctx.fillText("Round", WIDTH / 2 - 250, tableStartY);
    ctx.fillText("Score", WIDTH / 2 - 150, tableStartY);
    ctx.fillText("Time", WIDTH / 2 - 50, tableStartY);
    ctx.fillText("Attempts", WIDTH / 2 + 50, tableStartY);
    
    // Draw round data
    memoryGame.roundScores.forEach((round, i) => {
      let y = tableStartY + 30 + (i * 25);
      ctx.fillText(round.round.toString(), WIDTH / 2 - 250, y);
      ctx.fillText(round.score.toString(), WIDTH / 2 - 150, y);
      ctx.fillText(round.time.toFixed(1) + "s", WIDTH / 2 - 50, y);
      ctx.fillText(round.attempts.toString(), WIDTH / 2 + 50, y);
    });

    // High score comparison
    const topScore = getTopScore(gameOverOverlay.mode);
    ctx.textAlign = "center";
    if (gameOverOverlay.finalScore === topScore && topScore > 0) {
      ctx.font = "24px Arial";
      ctx.fillStyle = "#ffd700";
      ctx.fillText("🏆 NEW HIGH SCORE! 🏆", WIDTH / 2, HEIGHT / 2 + containerHeight/2 - 80);
    } else if (topScore > 0) {
      ctx.font = "20px Arial";
      ctx.fillStyle = "#4b0082";
      ctx.fillText("Personal Best: " + topScore, WIDTH / 2, HEIGHT / 2 + containerHeight/2 - 80);
    }
  } else {
    // Standard display for other modes
    ctx.font = "32px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("Final Score: " + gameOverOverlay.finalScore, WIDTH / 2, HEIGHT / 2 - 30);

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
  memoryClassicButtons = [
    new Button("RULES", WIDTH / 2 - 200, HEIGHT - 60, 120, 48),
    new Button("SCORES", WIDTH / 2 - 70, HEIGHT - 60, 120, 48),
    new Button("RESTART", WIDTH / 2 + 60, HEIGHT - 60, 120, 48),
    new Button("MENU", WIDTH / 2 + 190, HEIGHT - 60, 120, 48)
  ];
  memoryMemomuButtons = [
    new Button("BACK", WIDTH / 2 - 170, HEIGHT - 60, 130, 48),
    new Button("RESTART", WIDTH / 2, HEIGHT - 60, 170, 48),
    new Button("QUIT", WIDTH / 2 + 170, HEIGHT - 60, 130, 48)
  ];
  monluckButtons = [
    new Button("AGAIN", WIDTH / 2 - 190, HEIGHT - 60, 160, 48),
    new Button("MENU", WIDTH / 2, HEIGHT - 60, 160, 48),
    new Button("QUIT", WIDTH / 2 + 190, HEIGHT - 60, 160, 48)
  ];
  battleButtons = [
    new Button("GOT IT", WIDTH / 2, 520, 170, 60),
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

  // Shuffle and pick 8
  allImages = allImages.sort(() => Math.random() - 0.5);
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

  // Create deception sequence (different order of same images)
  musicMem.deceptionSequence = [...musicMem.memorySequence].sort(() => Math.random() - 0.5);

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
function startMemoryGameClassic() {
  memoryGame.currentRound = 1;
  memoryGame.maxRounds = 5;
  memoryGame.score = 0;
  memoryGame.roundScores = [];
  memoryGame.gameComplete = false;
  memoryGame.showRules = false;
  memoryGame.showHighScores = false;
  setupClassicMemoryRound();
}

function setupClassicMemoryRound() {
  // Progressive difficulty: Round 1: 3x4, Round 2: 4x4, Round 3: 5x4, Round 4: 6x4, Round 5: 6x5
  let gridConfig = getGridConfigForRound(memoryGame.currentRound);
  let rows = gridConfig.rows;
  let cols = gridConfig.cols;
  let totalTiles = rows * cols;
  memoryGame.totalPairs = totalTiles / 2;
  
  // Use different sets of images for each round
  let imageStartIdx = ((memoryGame.currentRound - 1) * 6) + 1;
  let images = [];
  for (let i = 0; i < memoryGame.totalPairs; i++) {
    let imgIdx = imageStartIdx + (i % 12); // Cycle through 12 images if needed
    images.push(imgIdx);
    images.push(imgIdx);
  }
  images = images.sort(() => Math.random() - 0.5);
  
  memoryGame.grid = createGrid(rows, cols, gridConfig.tileSize, gridConfig.gap, gridConfig.startY);
  memoryGame.revealed = Array(totalTiles).fill(false);
  memoryGame.matched = Array(totalTiles).fill(false);
  memoryGame.pairIds = images.slice();
  memoryGame.firstIdx = null;
  memoryGame.secondIdx = null;
  memoryGame.lock = false;
  memoryGame.pairsFound = 0;
  memoryGame.attempts = 0;
  memoryGame.feedback = "";
  // Simplified splash - only show for first round or briefly for transitions
  memoryGame.showSplash = memoryGame.currentRound === 1;
  memoryGame.splashTimer = memoryGame.currentRound === 1 ? 40 : 20;
  memoryGame.splashMsg = memoryGame.currentRound === 1 ? "Classic Memory" : `Round ${memoryGame.currentRound}`;
  memoryGame.startTime = Date.now();
}

function getGridConfigForRound(round) {
  switch(round) {
    case 1: return { rows: 3, cols: 4, tileSize: 105, gap: 12, startY: 180 }; // 12 tiles, 6 pairs
    case 2: return { rows: 4, cols: 4, tileSize: 95, gap: 10, startY: 160 };  // 16 tiles, 8 pairs
    case 3: return { rows: 4, cols: 5, tileSize: 85, gap: 8, startY: 150 };   // 20 tiles, 10 pairs
    case 4: return { rows: 4, cols: 6, tileSize: 75, gap: 7, startY: 140 };   // 24 tiles, 12 pairs
    case 5: return { rows: 5, cols: 6, tileSize: 70, gap: 6, startY: 130 };   // 30 tiles, 15 pairs
    default: return { rows: 3, cols: 4, tileSize: 105, gap: 12, startY: 180 };
  }
}

// --- MEMOMU MEMORY MODE LOGIC ---
function startMemoryGameMemomu() {
  memomuGame.round = 1;
  memomuGame.score = 0;
  memomuGame.showSplash = true;
  memomuGame.splashTimer = 45;
  memomuGame.splashMsg = "Round 1";
  setupMemoryMemomuRound();
}
function setupMemoryMemomuRound() {
  memomuGame.grid = createGrid(6, 5, 85, 10, 125);
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
  memomuGame.badClicks = 0;
  memomuGame.left = n + 1;
  memomuGame.timer = 0;
  memomuGame.phase = "show";
  memomuGame.feedback = "";
}

// --- MONLUCK LOGIC ---
function startMonluckGame() {
  monluckGame.grid = createGrid(6, 5, 85, 10, 125);
  let allIdx = Array.from({ length: 30 }, (_, i) => i);
  monluckGame.monadIndices = [];
  while (monluckGame.monadIndices.length < 5) {
    let idx = allIdx[Math.floor(Math.random() * allIdx.length)];
    if (!monluckGame.monadIndices.includes(idx)) monluckGame.monadIndices.push(idx);
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
      pool = pool.sort(() => Math.random() - 0.5);
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
    battleGame.phase = "countdown";
    battleGame.anim = performance.now() / 1000;
    prepareBattleRound();
    battleGame.flashing = true;
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
  ctx.font = "20px Arial";
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
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}
function drawMemoryMenu() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "44px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Choose Memory Mode", WIDTH / 2, 140);
  memoryMenuButtons.forEach(b => b.draw());
  ctx.font = "20px Arial";
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
  ctx.fillStyle = "#ff69b4";
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
  ctx.font = "20px Arial";
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
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}
function drawMemoryGameClassic() {
  // Handle rules display first
  if (memoryGame.showRules) {
    drawClassicMemoryRules();
    return;
  }
  
  // Handle high scores display
  if (memoryGame.showHighScores) {
    drawClassicMemoryHighScores();
    return;
  }
  
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Classic Memory", WIDTH / 2, 70);
  
  // Round and progress info
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Round: ${memoryGame.currentRound} / ${memoryGame.maxRounds}`, WIDTH / 2 - 120, 110);
  ctx.fillText(`Pairs: ${memoryGame.pairsFound} / ${memoryGame.totalPairs}`, WIDTH / 2 + 120, 110);
  
  memoryGame.grid.forEach((tile, i) => {
    ctx.save();
    let isRevealed = memoryGame.revealed[i] || memoryGame.matched[i];
    let img = assets.images["memimg" + memoryGame.pairIds[i]];
    if (isRevealed && img) ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    else {
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
      ctx.font = Math.floor(tile.size * 0.4) + "px Arial";
      ctx.fillStyle = "#ffb6c1";
      ctx.textAlign = "center";
      ctx.fillText("?", tile.x + tile.size / 2, tile.y + tile.size / 2 + tile.size * 0.1);
    }
    if (memoryGame.matched[i]) { ctx.strokeStyle = "#00f2ff"; ctx.lineWidth = 4; }
    else if (isRevealed) { ctx.strokeStyle = "#ff69b4"; ctx.lineWidth = 3; }
    else { ctx.strokeStyle = "#262626"; ctx.lineWidth = 2; }
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });
  
  memoryClassicButtons.forEach(b => b.draw());
  
  // Enhanced score display
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(memoryGame.feedback, WIDTH / 2, HEIGHT - 140);
  ctx.font = "21px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText(`Score: ${memoryGame.score}`, WIDTH / 2 - 120, HEIGHT - 100);
  ctx.fillText(`Attempts: ${memoryGame.attempts}`, WIDTH / 2 + 120, HEIGHT - 100);
  
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
  
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}

function drawClassicMemoryHighScores() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "45px Arial";
  ctx.textAlign = "center";
  ctx.fillText("High Scores - Classic Memory", WIDTH / 2, 80);
  
  const scores = highScores.memoryClassic || [];
  
  if (scores.length === 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText("No high scores yet!", WIDTH / 2, HEIGHT / 2);
    ctx.font = "22px Arial";
    ctx.fillText("Complete the Classic Memory challenge to set your first score!", WIDTH / 2, HEIGHT / 2 + 40);
  } else {
    // Table headers
    ctx.fillStyle = "#ffb6c1";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Rank", 120, 140);
    ctx.fillText("Score", 220, 140);
    ctx.fillText("Date", 320, 140);
    
    // Scores
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    scores.slice(0, 10).forEach((score, i) => {
      let y = 180 + i * 35;
      let rank = i + 1;
      let medal = "";
      if (rank === 1) medal = "🥇 ";
      else if (rank === 2) medal = "🥈 ";
      else if (rank === 3) medal = "🥉 ";
      
      ctx.fillText(medal + rank, 120, y);
      ctx.fillText(score.score.toString(), 220, y);
      
      let date = new Date(score.timestamp);
      ctx.fillText(date.toLocaleDateString(), 320, y);
    });
  }
  
  // Back button
  ctx.fillStyle = "#ff69b4";
  ctx.strokeStyle = "#ff69b4";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(WIDTH / 2 - 80, HEIGHT - 80, 160, 50, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("BACK", WIDTH / 2, HEIGHT - 50);
}
function drawClassicMemoryRules() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "45px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Classic Memory - Rules", WIDTH / 2, 80);
  
  ctx.fillStyle = "#fff";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  let rules = [
    "• Find matching pairs by clicking on tiles",
    "• Only 2 tiles can be revealed at once",
    "• Complete all pairs to advance to next round",
    "• 5 rounds with increasing difficulty",
    "• Bonus points for speed and accuracy",
    "• Fewer attempts = higher score",
    "",
    "Round progression:",
    "Round 1: 3×4 grid (6 pairs)",
    "Round 2: 4×4 grid (8 pairs)", 
    "Round 3: 4×5 grid (10 pairs)",
    "Round 4: 4×6 grid (12 pairs)",
    "Round 5: 5×6 grid (15 pairs)"
  ];
  
  let startY = 140;
  rules.forEach((rule, i) => {
    if (rule === "") {
      startY += 20;
      return;
    }
    if (rule.startsWith("Round progression:")) {
      ctx.fillStyle = "#ffb6c1";
      ctx.font = "26px Arial";
    } else if (rule.startsWith("Round")) {
      ctx.fillStyle = "#ff69b4";
      ctx.font = "22px Arial";
    } else {
      ctx.fillStyle = "#fff";
      ctx.font = "24px Arial";
    }
    ctx.fillText(rule, 80, startY + i * 35);
  });
  
  // Back button
  ctx.fillStyle = "#ff69b4";
  ctx.strokeStyle = "#ff69b4";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(WIDTH / 2 - 80, HEIGHT - 80, 160, 50, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GOT IT!", WIDTH / 2, HEIGHT - 50);
}
}
function drawMemoryGameMemomu() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MEMOMU Memory", WIDTH / 2, 90);
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Round: " + memomuGame.round + " / " + memomuGame.maxRounds, WIDTH / 2, 135);
  memomuGame.grid.forEach((tile, i) => {
    ctx.save();
    let img = assets.images["mmimg" + (i + 1)];
    if (tile.revealed && img) ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    else {
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
      ctx.font = "32px Arial";
      ctx.fillStyle = "#ffb6c1";
      ctx.textAlign = "center";
      ctx.fillText("?", tile.x + tile.size / 2, tile.y + tile.size / 2 + 11);
    }
    ctx.strokeStyle = tile.feedback ? tile.feedback : "#262626";
    ctx.lineWidth = tile.feedback ? 5 : 2;
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });
  memoryMemomuButtons.forEach(b => b.draw());
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(memomuGame.feedback, WIDTH / 2, HEIGHT - 120);
  ctx.font = "21px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText("Score: " + memomuGame.score, WIDTH / 2, HEIGHT - 80);
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
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);

  // Draw game over overlay if active
  drawGameOverOverlay();
}
function drawMonluckGame() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("MONLUCK", WIDTH / 2, 90);
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Clicks Left: " + (5 - monluckGame.clicks), WIDTH / 2, 135);
  monluckGame.grid.forEach((tile, i) => {
    ctx.save();
    let img = assets.images["mmimg" + (i + 1)];
    if (tile.revealed) {
      ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
      if (monluckGame.monadIndices.includes(i)) { ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 5; }
      else { ctx.strokeStyle = "#262626"; ctx.lineWidth = 2; }
    } else {
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
      ctx.font = "32px Arial";
      ctx.fillStyle = "#ffb6c1";
      ctx.textAlign = "center";
      ctx.fillText("?", tile.x + tile.size / 2, tile.y + tile.size / 2 + 11);
      ctx.strokeStyle = "#262626"; ctx.lineWidth = 2;
    }
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });
  monluckButtons.forEach(b => b.draw());
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(monluckGame.result, WIDTH / 2, HEIGHT - 120);
  ctx.font = "21px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText("Score: " + monluckGame.score, WIDTH / 2, HEIGHT - 80);
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
  ctx.font = "20px Arial";
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
    ctx.font = "48px Arial";
    ctx.fillStyle = "#222";
    ctx.fillText("BATTLE MODE RULES:", WIDTH / 2, HEIGHT / 2 - 180);
    ctx.font = "24px Arial";
    ctx.fillStyle = "#222";
    const rules = [
      "- Each round: 4x4 grid for you and opponent.",
      "- Your avatar appears 1-5 times per grid (both always equal).",
      "- Rounds 1-2: Only avatars shown, rest are blank.",
      "- Rounds 3-5: All tiles filled (images + avatars).",
      "- Click all your avatars, but one mistake ends your round!",
      "- Each avatar found: +1pt. If you find all avatars and are faster: +1pt bonus.",
      "- Win round (more avatars, or all + speed): +1pt bonus.",
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
    ctx.fillStyle = "#ffb6c1";
    ctx.fillText("Choose your fighter!", WIDTH / 2, 60);
    let img_w = 60, img_h = 60, col1_x = WIDTH / 2 - 180, col2_x = WIDTH / 2 + 40, y_start = 90, y_gap = 44 + img_h / 2;
    battleGame.chooseRects = [];
    for (let i = 0; i < 7; i++) {
      let img = assets.images[`avatar${i + 1}`];
      let rect = { x: col1_x, y: y_start + i * y_gap, w: img_w, h: img_h };
      if (img) ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.font = "24px Arial"; ctx.fillStyle = "#ff69b4";
      ctx.fillText(battleNames[i], col1_x + img_w + 20, rect.y + img_h / 2 + 8);
      battleGame.chooseRects.push({ ...rect, idx: i });
    }
    for (let i = 0; i < 6; i++) {
      let img = assets.images[`avatar${i + 8}`];
      let rect = { x: col2_x, y: y_start + i * y_gap, w: img_w, h: img_h };
      if (img) ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.font = "24px Arial"; ctx.fillStyle = "#ff69b4";
      ctx.fillText(battleNames[i + 7], col2_x + img_w + 20, rect.y + img_h / 2 + 8);
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
  ctx.font = "20px Arial";
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
    ctx.fillText(battleGame.resultText, WIDTH / 2, HEIGHT - 120);
  }
  if (battleGame.phase === "ready" && battleGame.round === 0) {
    battleButtons[1].draw();
  }
  if (battleGame.phase === "click") {
    let left = Math.max(0, 15 - (performance.now() / 1000 - battleGame.anim));
    ctx.font = "24px Arial"; ctx.fillStyle = "#ff69b4";
    ctx.fillText(`Time: ${Math.floor(left)}s`, WIDTH / 2, 520);
  }
  if (battleGame.phase === "countdown") {
    let c = Math.max(0, 3 - Math.floor(performance.now() / 1000 - battleGame.anim));
    ctx.font = "54px Arial"; ctx.fillStyle = "#ff69b4";
    ctx.fillText(`${c}`, WIDTH / 2, 520);
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
    if (memoryMenuButtons[0].isInside(mx, my)) { gameState = "memory_classic"; startMemoryGameClassic(); }
    else if (memoryMenuButtons[1].isInside(mx, my)) { gameState = "memory_memomu"; startMemoryGameMemomu(); }
    else if (memoryMenuButtons[2].isInside(mx, my)) { gameState = "mode"; }
  } else if (gameState === "memory_classic") {
    // Handle rules display
    if (memoryGame.showRules) {
      // Check for "GOT IT!" button click
      if (mx >= WIDTH / 2 - 80 && mx <= WIDTH / 2 + 80 && my >= HEIGHT - 80 && my <= HEIGHT - 30) {
        memoryGame.showRules = false;
        drawMemoryGameClassic();
      }
      return;
    }
    
    // Handle high scores display
    if (memoryGame.showHighScores) {
      // Check for "BACK" button click
      if (mx >= WIDTH / 2 - 80 && mx <= WIDTH / 2 + 80 && my >= HEIGHT - 80 && my <= HEIGHT - 30) {
        memoryGame.showHighScores = false;
        drawMemoryGameClassic();
      }
      return;
    }
    
    if (memoryClassicButtons[0].isInside(mx, my)) { 
      memoryGame.showRules = true; 
      drawMemoryGameClassic(); 
    }
    else if (memoryClassicButtons[1].isInside(mx, my)) { 
      memoryGame.showHighScores = true; 
      drawMemoryGameClassic(); 
    }
    else if (memoryClassicButtons[2].isInside(mx, my)) { startMemoryGameClassic(); drawMemoryGameClassic(); }
    else if (memoryClassicButtons[3].isInside(mx, my)) { gameState = "memory_menu"; }
    if (!memoryGame.showSplash && !memoryGame.lock) {
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
    if (memoryMemomuButtons[0].isInside(mx, my)) { gameState = "memory_menu"; }
    else if (memoryMemomuButtons[1].isInside(mx, my)) { startMemoryGameMemomu(); drawMemoryGameMemomu(); }
    else if (memoryMemomuButtons[2].isInside(mx, my)) { gameState = "menu"; }
    if (!memomuGame.showSplash && memomuGame.phase === "guess" && memomuGame.left > 0) {
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
    if (monluckButtons[0].isInside(mx, my)) { startMonluckGame(); drawMonluckGame(); }
    else if (monluckButtons[1].isInside(mx, my)) { gameState = "mode"; }
    else if (monluckButtons[2].isInside(mx, my)) { gameState = "menu"; }
    if (!monluckGame.showSplash && !monluckGame.finished && monluckGame.clicks < 5) {
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
  } else if (gameState === "battle") {
    handleBattleClick(mx, my);
  }
});

// --- MEMORY CLASSIC CLICK LOGIC ---
function handleMemoryTileClickClassic(idx) {
  if (memoryGame.lock || memoryGame.revealed[idx] || memoryGame.matched[idx]) return;
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
        memoryGame.matched[memoryGame.firstIdx] = true;
        memoryGame.matched[memoryGame.secondIdx] = true;
        memoryGame.pairsFound++;
        
        // Enhanced scoring system
        let baseScore = 10;
        let speedBonus = Math.max(0, 50 - Math.floor((Date.now() - memoryGame.startTime) / 1000));
        let accuracyBonus = Math.max(0, 20 - memoryGame.attempts);
        let roundBonus = memoryGame.currentRound * 5;
        let pairScore = baseScore + speedBonus + accuracyBonus + roundBonus;
        memoryGame.score += pairScore;
        
        memoryGame.feedback = `Match! +${pairScore} points`;
        let sfx = assets.sounds["yupi"];
        if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
      } else {
        memoryGame.revealed[memoryGame.firstIdx] = false;
        memoryGame.revealed[memoryGame.secondIdx] = false;
        memoryGame.feedback = "Miss!";
        let sfx = assets.sounds["buuuu"];
        if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
      }
      memoryGame.firstIdx = null;
      memoryGame.secondIdx = null;
      memoryGame.lock = false;
      
      if (memoryGame.pairsFound === memoryGame.totalPairs) {
        // Round completed
        let roundTime = (Date.now() - memoryGame.startTime) / 1000;
        let timeBonus = Math.max(0, Math.floor(100 - roundTime));
        memoryGame.score += timeBonus;
        memoryGame.roundScores.push({
          round: memoryGame.currentRound,
          score: memoryGame.score,
          time: roundTime,
          attempts: memoryGame.attempts
        });
        
        if (memoryGame.currentRound < memoryGame.maxRounds) {
          // Next round - smoother transition
          memoryGame.feedback = `Round ${memoryGame.currentRound} Complete! Time Bonus: +${timeBonus}`;
          memoryGame.currentRound++;
          setTimeout(() => {
            setupClassicMemoryRound();
            drawMemoryGameClassic();
          }, 1500); // Reduced delay for faster gameplay
        } else {
          // Game completed
          memoryGame.gameComplete = true;
          addHighScore('memoryClassic', memoryGame.score);
          memoryGame.feedback = "All Rounds Complete!";
          setTimeout(() => { 
            showGameOverOverlay('memoryClassic', memoryGame.score);
          }, 2000); // Reduced delay
        }
      }
      drawMemoryGameClassic();
    }, 900);
  }
}

// --- MEMOMU MEMORY CLICK LOGIC ---
function handleMemoryTileClickMemomu(idx) {
  let tile = memomuGame.grid[idx];
  if (tile.revealed) return;
  memomuGame.left--;
  tile.revealed = true;
  if (memomuGame.flashSeq.includes(idx) && !memomuGame.found.includes(idx)) {
    memomuGame.found.push(idx);
    let sfx = assets.sounds["yupi"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#00ff00";
  } else {
    memomuGame.badClicks++;
    let sfx = assets.sounds["kuku"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#ff0000";
  }
  let perfect = (memomuGame.found.length === memomuGame.flashSeq.length && memomuGame.badClicks === 0);
  if (memomuGame.found.length === memomuGame.flashSeq.length || memomuGame.badClicks >= 2 || memomuGame.left === 0) {
    let roundTime = Math.max(0, 5 + (memomuGame.round - 1) * 2 - (performance.now() / 1000 - memomuGame.timer));
    let pts = memomuGame.found.length + (perfect ? 2 : 0) + (perfect ? Math.floor(roundTime) : 0);
    memomuGame.score += pts;
    memomuGame.feedback = "Round: " + memomuGame.round + " Score: +" + pts;
    memomuGame.phase = "done";
    setTimeout(() => {
      memomuGame.round++;
      if (memomuGame.round > memomuGame.maxRounds) {
        memomuGame.showSplash = true;
        memomuGame.splashMsg = "Game Over!\nScore: " + memomuGame.score;
        setTimeout(() => { gameState = "memory_menu"; }, 2200);
      } else {
        memomuGame.showSplash = true;
        memomuGame.splashTimer = 45;
        memomuGame.splashMsg = "Round " + memomuGame.round;
        setupMemoryMemomuRound();
        drawMemoryGameMemomu();
      }
    }, 1100);
  }
}
function runMemoryMemomuFlashSequence() {
  let flashTiles = memomuGame.flashSeq.slice();
  let i = 0;
  function flashStep() {
    if (i < flashTiles.length) {
      let idx = flashTiles[i];
      memomuGame.grid.forEach((t, j) => t.revealed = j === idx);
      drawMemoryGameMemomu();
      setTimeout(() => {
        memomuGame.grid[idx].revealed = false;
        drawMemoryGameMemomu();
        i++;
        setTimeout(flashStep, 250);
      }, 450);
    } else {
      memomuGame.phase = "guess";
      memomuGame.left = memomuGame.round + 1;
      memomuGame.found = [];
      memomuGame.badClicks = 0;
      memomuGame.timer = performance.now() / 1000;
      memomuGame.grid.forEach((t) => { t.revealed = false; t.feedback = null; });
      drawMemoryGameMemomu();
    }
  }
  flashStep();
}

// --- MONLUCK CLICK LOGIC ---
function handleMonluckTileClick(idx) {
  let tile = monluckGame.grid[idx];
  if (tile.revealed || monluckGame.finished) return;
  tile.revealed = true;
  monluckGame.clicks++;
  let isMonad = monluckGame.monadIndices.includes(idx);
  if (isMonad) {
    monluckGame.found.push(idx);
    let sfx = assets.sounds["yupi"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#ffd700";
  } else {
    let sfx = assets.sounds["kuku"];
    if (soundOn && sfx) { try { sfx.currentTime = 0; sfx.play(); } catch (e) { } }
    tile.feedback = "#ff0000";
  }
  if (monluckGame.clicks >= 5) {
    let hits = monluckGame.found.length;
    let mult = { 1: 2, 2: 5, 3: 40, 4: 500, 5: 1000 }[hits] || 0;
    let score = Math.round(monluckGame.wager * mult);
    monluckGame.score = score;
    monluckGame.result = hits === 0 ? "GMOVER!" : `YUPI! Score: ${score} (Hits: ${hits})`;
    monluckGame.finished = true;
    setTimeout(() => {
      monluckGame.showSplash = true;
      monluckGame.splashMsg = hits === 0 ? "Game Over!" : `Victory!\nScore: ${score}`;
      drawMonluckGame();
    }, 1100);
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
        battleGame.flashing = true;
        battleGame.anim = performance.now() / 1000;
        battleGame.phase = "flash";
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
    else { memomuGame.showSplash = false; memomuGame.feedback = ""; runMemoryMemomuFlashSequence(); }
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
        battleGame.phase = "ready";
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
  else if (gameState === "memory_classic") drawMemoryGameClassic();
  else if (gameState === "memory_memomu") drawMemoryGameMemomu();
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
