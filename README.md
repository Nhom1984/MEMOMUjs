# MEMOMU Game

A complete memory and music game written in pure JavaScript with HTML5 Canvas. MEMOMU features multiple game modes including music memory challenges, classic memory matching, pattern recognition, and AI battle modes.

## 🎮 Game Modes

### 1. Music Memory
- Listen to melodic sequences and repeat them by clicking colored tiles
- Progressive difficulty with increasing sequence length
- Audio-visual feedback with musical notes

### 2. Memory Classic  
- Traditional memory matching game
- Find pairs of matching images
- Score based on number of attempts

### 3. MEMOMU Memory
- Watch flashing tile sequences and repeat them in order
- Advanced pattern recognition challenges
- Progressive rounds with increasing complexity

### 4. Monluck
- Find hidden monad symbols in a grid
- Mystery clicking game with discovery elements
- Limited clicks challenge

### 5. Battle Mode
- Choose your fighter avatar
- Compete against AI in memory challenges  
- Strategic gameplay with scoring system
- Dynamic difficulty adjustment

## 🚀 Quick Start

### Option 1: Ready to Play (with your own assets)
1. Clone this repository
2. Add your images and sounds to the `/assets/` folder (see requirements below)
3. Open `index.html` in your web browser
4. Start playing!

### Option 2: Test with Placeholder Assets
1. Clone this repository
2. Run the placeholder generator: `./generate-placeholder-assets.sh`
3. Open `index.html` in your web browser
4. Test the game functionality (replace with real assets later)

## 📁 File Structure

```
MEMOMUjs/
├── index.html              # Main HTML file with canvas
├── memomu.js              # Complete game implementation
├── assets/                # Game assets folder
│   ├── README.md          # Asset requirements documentation
│   ├── MEMOMU1.png        # Main game logo
│   ├── monad.png          # Monad symbol for Monluck mode
│   ├── image1.png         # Game image 1
│   ├── ...                # Game images 2-33
│   ├── yupi.mp3           # Success sound
│   ├── kuku.mp3           # Click sound  
│   ├── buuuu.mp3          # Error sound
│   └── MEMOMU.mp3         # Background music
├── generate-placeholder-assets.sh  # Creates test assets
└── README.md              # This file
```

## 🎨 Asset Requirements

### Required Images (PNG format):
- `MEMOMU1.png` - Main game logo/title image
- `monad.png` - Monad symbol for Monluck mode  
- `image1.png` through `image33.png` - Game images:
  - Images 1-12: Used across multiple game modes
  - Image 13: Battle mode avatar
  - Images 14-33: Battle mode grid images

### Required Sounds (MP3 format):
- `yupi.mp3` - Success/positive feedback sound
- `kuku.mp3` - Click/interaction sound
- `buuuu.mp3` - Error/negative feedback sound
- `MEMOMU.mp3` - Background music (loops automatically)

## 🔧 Technical Details

- **Framework**: Pure JavaScript (no dependencies)
- **Graphics**: HTML5 Canvas
- **Audio**: HTML5 Audio API
- **Canvas Size**: 800x700 pixels
- **Browser Support**: Modern browsers with ES6+ support

## 🎯 Game Features

- **Complete Asset Loading System**: Preloads all images and sounds
- **Multiple Game Modes**: 5 different gameplay experiences  
- **Sound Management**: Toggle sound on/off, background music
- **Responsive UI**: Button-based navigation system
- **Progressive Difficulty**: Games increase in challenge
- **AI Opponent**: Smart computer player in battle mode
- **Score Tracking**: Points and performance feedback
- **Visual Effects**: Animations, flashing, transitions

## 🔊 Sound Toggle

- Press any sound-related button or use game controls to toggle sound
- Background music plays automatically when sound is enabled
- All sound effects respect the global sound setting

## 🤖 Battle Mode AI

The battle mode features an intelligent AI opponent that:
- Analyzes the current game grid
- Makes strategic decisions based on tile patterns
- Provides varying difficulty levels
- Responds with realistic timing delays

## 🎵 Music Memory Details

- Uses a 4x3 grid of colored musical tiles
- Each tile corresponds to a different musical note
- Sequences start simple and grow more complex
- Visual and audio feedback for each interaction
- Progressive scoring system

## 🃏 Memory Classic Features

- Traditional card-matching gameplay
- Flip two cards to find matching pairs
- Score based on efficiency (fewer attempts = higher score)
- Visual feedback for matches and mismatches
- Automatic game completion detection

## 🧩 MEMOMU Memory Challenge

- Advanced pattern recognition game
- Watch sequences of flashing tiles
- Reproduce the exact sequence by clicking
- Progressive rounds with increasing difficulty
- Penalty system for incorrect clicks

## 🔍 Monluck Discovery Game

- Hidden symbol finding challenge
- Click tiles to reveal hidden monad symbols
- Limited number of clicks adds strategy
- Success depends on pattern recognition and luck

## 📱 Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with HTML5 Canvas and Audio support

## 🐛 Troubleshooting

### Game doesn't load:
- Check browser console for asset loading errors
- Ensure all required files are in `/assets/` folder
- Verify file names match exactly (case-sensitive)

### No sound:
- Check if browser allows autoplay (may need user interaction first)
- Verify MP3 files are valid and accessible
- Check browser console for audio loading errors

### Images not showing:
- Confirm all PNG files are present in `/assets/`
- Check file permissions (must be readable)
- Verify image files are not corrupted

## 🔄 Development

The game is implemented as a single JavaScript file (`memomu.js`) containing:

- Asset loading and management system
- Game state management
- All game mode implementations  
- Canvas rendering system
- Event handling for mouse/touch input
- Audio system integration
- Main game loop with animation timing

## 📜 License

Copyright 2025 Nhom1984. All rights reserved.

## 🤝 Contributing

This is a complete, ready-to-use game implementation. If you encounter any issues or have suggestions for improvements, please open an issue in the repository.

---

**Ready to play?** Add your assets to the `/assets/` folder and open `index.html` in your browser!