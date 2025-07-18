# MEMOMU Game Assets

This folder should contain all the assets required for the MEMOMU game to function properly.

## Required Image Files:

### Main Images:
- `MEMOMU1.png` - Main game logo/title image
- `monad.png` - Monad symbol for Monluck mode

### Game Images (image1.png through image33.png):
- `image1.png` through `image12.png` - General game images used in multiple modes
- `image13.png` - Used as avatar in battle mode
- `image14.png` through `image33.png` - Battle mode grid images

**Note:** Images 1-12 are reused across different game modes:
- Music Memory mode uses images 1-12
- Memory Classic uses images 1-6  
- MEMOMU Memory uses images 1-12 (repeated for 30 tiles)
- Battle mode uses images 1-13 for avatars and 14-33 for grid

## Required Sound Files:

- `yupi.mp3` - Success/positive feedback sound
- `kuku.mp3` - Click/interaction sound
- `buuuu.mp3` - Error/negative feedback sound  
- `MEMOMU.mp3` - Background music (will loop)

## File Requirements:

- All images should be PNG format
- All sounds should be MP3 format
- Files should be reasonably sized for web use
- Images should have consistent dimensions for best visual results

## Usage:

1. Add all required files to this /assets/ folder
2. Open index.html in your browser
3. The game will automatically load all assets and start

If any assets are missing, the game will still run but may show loading errors in the browser console.