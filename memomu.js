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
];
for (let i = 1; i <= 12; i++) imageFiles.push({ name: `img${i}`, src: `assets/image${i}.png` });
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

async function loadAssets() {
  let promises = [];
  for (let file of imageFiles) promises.push(loadImage(file.name, file.src));
  for (let file of soundFiles) promises.push(loadSound(file.name, file.src));
  await Promise.all(promises);
}

// --- BUTTONS ---
class Button {
  constructor(label, x, y, w = 280, h = 56) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  draw() {
    ctx.save();
    ctx.fillStyle = "#ffb6c1";
    ctx.strokeStyle = "#ff69b4";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#222";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.label, this.x, this.y);
    ctx.restore();
  }
  isInside(mx, my) {
    return mx >= this.x - this.w / 2 && mx <= this.x + this.w / 2 &&
      my >= this.y - this.h / 2 && my <= this.y + this.h / 2;
  }
}

// --- GAME STATE ---
let gameState = "loading"; // loading, menu, mode, musicmem, memory_menu, memory_classic, memory_memomu, monluck, battle
let menuButtons = [], modeButtons = [], musicMemButtons = [], memoryMenuButtons = [], memoryClassicButtons = [], memoryMemomuButtons = [], monluckButtons = [], battleButtons = [];
let soundOn = true;

// --- MUSIC MEMORY MODE DATA ---
let musicMem = {
  grid: [],
  sequence: [],
  userSequence: [],
  currentRound: 1,
  maxRounds: 5,
  playingMelody: false,
  allowInput: false,
  score: 0,
  feedback: "",
  tiles: [],
  showRoundSplash: true,
  splashTimer: 0,
  splashMsg: "",
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
  score: 0
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

// --- BUTTONS SETUP ---
function setupButtons() {
  menuButtons = [
    new Button("NEW GAME", WIDTH / 2, 425, 400, 70),
    new Button(soundOn ? "SOUND ON" : "SOUND OFF", WIDTH - 100, 55, 170, 44),
    new Button("QUIT", WIDTH / 2, 504, 250, 60),
  ];
  let modeY = 295 + 85;
  let modeGap = 85;
  modeButtons = [
    new Button("MUSIC MEMORY", WIDTH / 2, modeY, 340, 65),
    new Button("MEMORY", WIDTH / 2, modeY + modeGap, 340, 65),
    new Button("MONLUCK", WIDTH / 2, modeY + modeGap * 2, 340, 65),
    new Button("BATTLE", WIDTH / 2, modeY + modeGap * 3, 340, 65),
    new Button("SOUND", WIDTH - 100, 55, 170, 44),
    new Button("BACK", WIDTH / 2, modeY + modeGap * 4 + 20, 340, 65)
  ];
  musicMemButtons = [
    new Button("BACK", WIDTH / 2 - 210, HEIGHT - 60, 180, 48),
    new Button("PLAY MELODY", WIDTH / 2, HEIGHT - 60, 230, 48),
    new Button("QUIT", WIDTH / 2 + 210, HEIGHT - 60, 180, 48)
  ];
  let memY = 300;
  memoryMenuButtons = [
    new Button("CLASSIC", WIDTH / 2, memY, 320, 56),
    new Button("MEMOMU", WIDTH / 2, memY + 80, 320, 56),
    new Button("BACK", WIDTH / 2, memY + 160, 320, 56)
  ];
  memoryClassicButtons = [
    new Button("BACK", WIDTH / 2 - 150, HEIGHT - 60, 150, 48),
    new Button("RESTART", WIDTH / 2, HEIGHT - 60, 170, 48),
    new Button("QUIT", WIDTH / 2 + 150, HEIGHT - 60, 150, 48)
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
  musicMem.splashTimer = 45;
  musicMem.splashMsg = "Round 1";
  setupMusicMemRound();
}
function setupMusicMemRound() {
  musicMem.grid = createGrid(3, 4, 105, 12, 180);
  let melodyLen = Math.min(musicMem.currentRound + 2, 8);
  let tileIndices = Array.from({ length: 12 }, (_, i) => i + 1);
  musicMem.sequence = [];
  for (let i = 0; i < melodyLen; i++) {
    let idx = tileIndices[Math.floor(Math.random() * tileIndices.length)];
    musicMem.sequence.push(idx);
  }
  musicMem.userSequence = [];
  musicMem.playingMelody = false;
  musicMem.allowInput = false;
  musicMem.feedback = "";
  // Reset tile states
  musicMem.grid.forEach(tile => {
    tile.selected = false;
    tile.highlight = false;
    tile.feedback = null;
  });
}
function playMelody() {
  if (musicMem.playingMelody) return; // Prevent multiple simultaneous melodies
  
  musicMem.playingMelody = true;
  musicMem.allowInput = false;
  musicMem.feedback = "Listen carefully...";
  
  let i = 0;
  const noteInterval = 650; // Improved timing for better synchronization
  const noteHighlightDuration = 450;
  
  function playStep() {
    if (i < musicMem.sequence.length) {
      let idx = musicMem.sequence[i];
      let tile = musicMem.grid[idx - 1];
      
      // Clear all highlights first
      musicMem.grid.forEach(t => t.highlight = false);
      
      // Highlight current tile
      tile.highlight = true;
      drawMusicMemory();
      
      // Play sound with better error handling
      let sfx = assets.sounds["yupi"];
      if (soundOn && sfx) {
        try {
          sfx.currentTime = 0;
          // Create a new audio instance for better playback control
          let audioClone = sfx.cloneNode();
          audioClone.volume = 0.7;
          audioClone.play().catch(e => console.log("Audio play failed:", e));
        } catch (e) {
          console.log("Audio error:", e);
        }
      }
      
      setTimeout(() => {
        tile.highlight = false;
        drawMusicMemory();
        i++;
        
        if (i < musicMem.sequence.length) {
          setTimeout(playStep, noteInterval - noteHighlightDuration);
        } else {
          // Melody finished
          setTimeout(() => {
            musicMem.playingMelody = false;
            musicMem.allowInput = true;
            musicMem.feedback = "Your turn! Click the tiles in order.";
            drawMusicMemory();
          }, 200);
        }
      }, noteHighlightDuration);
    }
  }
  
  playStep();
}

// --- CLASSIC MEMORY MODE LOGIC ---
function startMemoryGameClassic() {
  let images = [];
  for (let i = 1; i <= 6; i++) { images.push(i); images.push(i); }
  images = images.sort(() => Math.random() - 0.5);
  memoryGame.grid = createGrid(3, 4);
  memoryGame.revealed = Array(12).fill(false);
  memoryGame.matched = Array(12).fill(false);
  memoryGame.pairIds = images.slice();
  memoryGame.firstIdx = null;
  memoryGame.secondIdx = null;
  memoryGame.lock = false;
  memoryGame.pairsFound = 0;
  memoryGame.attempts = 0;
  memoryGame.feedback = "";
  memoryGame.showSplash = true;
  memoryGame.splashTimer = 40;
  memoryGame.splashMsg = "Classic Memory";
  memoryGame.score = 0;
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
  ctx.fillText("MEMOMU", WIDTH / 2, 350);
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
  ctx.fillText("Choose Game Mode", WIDTH / 2, 340);
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
function drawMusicMemory() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Music Memory", WIDTH / 2, 90);
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Round " + musicMem.currentRound + " / " + musicMem.maxRounds, WIDTH / 2, 135);
  
  // Show sequence progress
  if (musicMem.allowInput) {
    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffb6c1";
    ctx.fillText(`Progress: ${musicMem.userSequence.length}/${musicMem.sequence.length}`, WIDTH / 2, 155);
  }
  
  musicMem.grid.forEach(tile => {
    ctx.save();
    let img = assets.images["img" + tile.idx];
    if (img) ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    else { ctx.fillStyle = "#333"; ctx.fillRect(tile.x, tile.y, tile.size, tile.size); }
    
    // Enhanced visual feedback
    if (tile.highlight) { 
      ctx.strokeStyle = "#ff69b4"; 
      ctx.lineWidth = 8;
      ctx.shadowColor = "#ff69b4";
      ctx.shadowBlur = 10;
    }
    else if (tile.selected) { 
      ctx.strokeStyle = "#00f2ff"; 
      ctx.lineWidth = 5; 
      ctx.shadowColor = "#00f2ff";
      ctx.shadowBlur = 5;
    }
    else if (tile.feedback) {
      ctx.strokeStyle = tile.feedback;
      ctx.lineWidth = 6;
      ctx.shadowColor = tile.feedback;
      ctx.shadowBlur = 8;
    }
    else { 
      ctx.strokeStyle = "#262626"; 
      ctx.lineWidth = 2; 
      ctx.shadowBlur = 0;
    }
    
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    
    // Add tile number for better identification
    if (!tile.highlight && musicMem.allowInput) {
      ctx.font = "16px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(tile.idx.toString(), tile.x + tile.size - 15, tile.y + 20);
    }
    
    ctx.restore();
  });
  
  musicMemButtons.forEach(b => b.draw());
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(musicMem.feedback, WIDTH / 2, HEIGHT - 120);
  ctx.font = "21px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText("Score: " + musicMem.score, WIDTH / 2, HEIGHT - 80);
  
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
  ctx.font = "20px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.fillText("© 2025 Nhom1984", WIDTH - 35, HEIGHT - 22);
}
function drawMemoryGameClassic() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ff69b4";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Classic Memory", WIDTH / 2, 90);
  ctx.font = "22px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Pairs: " + memoryGame.pairsFound + " / 6", WIDTH / 2, 135);
  memoryGame.grid.forEach((tile, i) => {
    ctx.save();
    let isRevealed = memoryGame.revealed[i] || memoryGame.matched[i];
    let img = assets.images["memimg" + memoryGame.pairIds[i]];
    if (isRevealed && img) ctx.drawImage(img, tile.x, tile.y, tile.size, tile.size);
    else {
      ctx.fillStyle = "#333";
      ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
      ctx.font = "46px Arial";
      ctx.fillStyle = "#ffb6c1";
      ctx.textAlign = "center";
      ctx.fillText("?", tile.x + tile.size / 2, tile.y + tile.size / 2 + 14);
    }
    if (memoryGame.matched[i]) { ctx.strokeStyle = "#00f2ff"; ctx.lineWidth = 4; }
    else if (isRevealed) { ctx.strokeStyle = "#ff69b4"; ctx.lineWidth = 3; }
    else { ctx.strokeStyle = "#262626"; ctx.lineWidth = 2; }
    ctx.strokeRect(tile.x, tile.y, tile.size, tile.size);
    ctx.restore();
  });
  memoryClassicButtons.forEach(b => b.draw());
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(memoryGame.feedback, WIDTH / 2, HEIGHT - 120);
  ctx.font = "21px Arial";
  ctx.fillStyle = "#ffb6c1";
  ctx.fillText("Score: " + memoryGame.score, WIDTH / 2, HEIGHT - 80);
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
    if (modeButtons[0].isInside(mx, my)) { gameState = "musicmem"; startMusicMemoryGame(); }
    else if (modeButtons[1].isInside(mx, my)) { gameState = "memory_menu"; }
    else if (modeButtons[2].isInside(mx, my)) { gameState = "monluck"; startMonluckGame(); }
    else if (modeButtons[3].isInside(mx, my)) { gameState = "battle"; resetBattleGame(); }
    else if (modeButtons[4].isInside(mx, my)) {
      soundOn = !soundOn;
      modeButtons[4].label = soundOn ? "SOUND ON" : "SOUND OFF";
      let music = assets.sounds["music"];
      if (soundOn && music) music.play();
      else if (music) music.pause();
    }
    else if (modeButtons[5].isInside(mx, my)) { gameState = "menu"; }
  } else if (gameState === "musicmem") {
    if (musicMemButtons[0].isInside(mx, my)) { gameState = "mode"; }
    else if (musicMemButtons[1].isInside(mx, my)) {
      if (!musicMem.playingMelody && !musicMem.showRoundSplash) playMelody();
    }
    else if (musicMemButtons[2].isInside(mx, my)) { gameState = "menu"; }
    if (musicMem.allowInput && !musicMem.playingMelody && !musicMem.showRoundSplash) {
      for (let tile of musicMem.grid) {
        if (
          mx >= tile.x &&
          mx <= tile.x + tile.size &&
          my >= tile.y &&
          my <= tile.y + tile.size
        ) {
          if (!tile.selected && musicMem.userSequence.length < musicMem.sequence.length) {
            tile.selected = true;
            musicMem.userSequence.push(tile.idx);
            
            // Provide immediate audio feedback
            let sfx = assets.sounds["kuku"];
            if (soundOn && sfx) { 
              try { 
                sfx.currentTime = 0; 
                let audioClone = sfx.cloneNode();
                audioClone.volume = 0.5;
                audioClone.play(); 
              } catch (e) { console.log("Audio error:", e); } 
            }
            
            // Check if sequence is complete
            if (musicMem.userSequence.length === musicMem.sequence.length) {
              musicMem.allowInput = false;
              musicMem.feedback = "Checking sequence...";
              setTimeout(() => checkMusicMemResult(), 800); // Small delay for better UX
            } else {
              // Update feedback to show progress
              musicMem.feedback = `Good! ${musicMem.userSequence.length}/${musicMem.sequence.length} tiles selected`;
            }
            
            drawMusicMemory();
            break;
          } else if (tile.selected) {
            // Provide feedback that tile is already selected
            musicMem.feedback = "Tile already selected!";
            let sfx = assets.sounds["buuuu"];
            if (soundOn && sfx) { 
              try { 
                sfx.currentTime = 0; 
                let audioClone = sfx.cloneNode();
                audioClone.volume = 0.3;
                audioClone.play(); 
              } catch (e) { console.log("Audio error:", e); } 
            }
            setTimeout(() => {
              musicMem.feedback = `Progress: ${musicMem.userSequence.length}/${musicMem.sequence.length}`;
              drawMusicMemory();
            }, 1000);
            drawMusicMemory();
            break;
          }
        }
      }
    }
  } else if (gameState === "memory_menu") {
    if (memoryMenuButtons[0].isInside(mx, my)) { gameState = "memory_classic"; startMemoryGameClassic(); }
    else if (memoryMenuButtons[1].isInside(mx, my)) { gameState = "memory_memomu"; startMemoryGameMemomu(); }
    else if (memoryMenuButtons[2].isInside(mx, my)) { gameState = "mode"; }
  } else if (gameState === "memory_classic") {
    if (memoryClassicButtons[0].isInside(mx, my)) { gameState = "memory_menu"; }
    else if (memoryClassicButtons[1].isInside(mx, my)) { startMemoryGameClassic(); drawMemoryGameClassic(); }
    else if (memoryClassicButtons[2].isInside(mx, my)) { gameState = "menu"; }
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
        memoryGame.score += 2;
        memoryGame.feedback = "Match!";
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
      if (memoryGame.pairsFound === 6) {
        memoryGame.feedback = "You win!";
        memoryGame.showSplash = true;
        memoryGame.splashTimer = 55;
        memoryGame.splashMsg = "Victory!\nScore: " + memoryGame.score + "\nAttempts: " + memoryGame.attempts;
        setTimeout(() => { gameState = "memory_menu"; }, 2200);
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

// --- MUSIC MEMORY RESULT CHECK ---
function checkMusicMemResult() {
  let correct = true;
  let correctCount = 0;
  
  // Check each input against the sequence
  for (let i = 0; i < musicMem.sequence.length; i++) {
    if (i < musicMem.userSequence.length) {
      if (musicMem.userSequence[i] === musicMem.sequence[i]) {
        correctCount++;
      } else {
        correct = false;
        break;
      }
    } else {
      correct = false;
      break;
    }
  }
  
  // Provide visual feedback on tiles
  musicMem.grid.forEach((tile, idx) => {
    const tileNum = idx + 1;
    const userIndex = musicMem.userSequence.indexOf(tileNum);
    const correctIndex = musicMem.sequence.indexOf(tileNum);
    
    if (userIndex !== -1) {
      if (userIndex < musicMem.sequence.length && musicMem.sequence[userIndex] === tileNum) {
        tile.feedback = "#00ff00"; // Green for correct
      } else {
        tile.feedback = "#ff0000"; // Red for wrong
      }
    }
  });
  
  if (correct && correctCount === musicMem.sequence.length) {
    musicMem.feedback = `Perfect! +${correctCount} points`;
    musicMem.score += correctCount;
    let sfx = assets.sounds["yupi"];
    if (soundOn && sfx) { 
      try { 
        sfx.currentTime = 0; 
        let audioClone = sfx.cloneNode();
        audioClone.volume = 0.8;
        audioClone.play(); 
      } catch (e) { console.log("Audio error:", e); } 
    }
    setTimeout(() => {
      clearTileFeedback();
      nextMusicMemRound();
    }, 1500);
  } else {
    musicMem.feedback = `Wrong sequence! Got ${correctCount}/${musicMem.sequence.length} correct`;
    let sfx = assets.sounds["buuuu"];
    if (soundOn && sfx) { 
      try { 
        sfx.currentTime = 0; 
        let audioClone = sfx.cloneNode();
        audioClone.volume = 0.6;
        audioClone.play(); 
      } catch (e) { console.log("Audio error:", e); } 
    }
    setTimeout(() => {
      clearTileFeedback();
      nextMusicMemRound();
    }, 2000);
  }
  drawMusicMemory();
}

function clearTileFeedback() {
  musicMem.grid.forEach(tile => {
    tile.selected = false;
    tile.highlight = false;
    tile.feedback = null;
  });
}

function nextMusicMemRound() {
  if (musicMem.currentRound < musicMem.maxRounds) {
    musicMem.currentRound++;
    musicMem.showRoundSplash = true;
    musicMem.splashTimer = 45;
    musicMem.splashMsg = `Round ${musicMem.currentRound}`;
    setupMusicMemRound();
  } else {
    musicMem.showRoundSplash = true;
    musicMem.splashTimer = 80;
    musicMem.splashMsg = `Game Complete!\nFinal Score: ${musicMem.score}`;
    setTimeout(() => { gameState = "mode"; }, 2500);
  }
  drawMusicMemory();
}

// --- SPLASH TIMER ---
function tickSplash() {
  if (gameState === "musicmem" && musicMem.showRoundSplash) {
    if (musicMem.splashTimer > 0) musicMem.splashTimer--;
    else { musicMem.showRoundSplash = false; musicMem.feedback = ""; playMelody(); }
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
  let music = assets.sounds["music"];
  if (music) { music.loop = true; music.volume = 0.55; if (soundOn) music.play(); }
});

gameLoop();
