#!/bin/bash

# MEMOMU Asset Generator - Creates placeholder assets for testing
# Run this script to generate simple placeholder images and sounds

echo "Creating placeholder assets for MEMOMU game..."

# Create the assets directory if it doesn't exist
mkdir -p assets

# Generate placeholder images using ImageMagick (if available) or create simple files
if command -v convert >/dev/null 2>&1; then
    echo "Using ImageMagick to create placeholder images..."
    
    # Main images
    convert -size 200x100 xc:pink -pointsize 30 -fill black -gravity center -annotate +0+0 "MEMOMU" assets/MEMOMU1.png
    convert -size 100x100 xc:lightblue -pointsize 20 -fill darkblue -gravity center -annotate +0+0 "MONAD" assets/monad.png
    
    # Game images 1-33
    for i in {1..33}; do
        # Create different colored squares with numbers
        color=$(printf "hsl(%d,70%%,60%%)" $((i * 10)))
        convert -size 100x100 "xc:$color" -pointsize 30 -fill white -gravity center -annotate +0+0 "$i" "assets/image$i.png"
    done
    
    echo "Placeholder images created!"
else
    echo "ImageMagick not found. Creating simple placeholder image files..."
    
    # Create empty placeholder files with descriptive names
    for file in MEMOMU1.png monad.png; do
        echo "# Placeholder for $file" > "assets/$file.placeholder"
    done
    
    for i in {1..33}; do
        echo "# Placeholder for image$i.png" > "assets/image$i.png.placeholder"
    done
    
    echo "Placeholder files created (replace with actual PNG images)"
fi

# Generate placeholder sounds
echo "Creating placeholder sound files..."

# Create empty placeholder audio files with descriptions
for sound in yupi.mp3 kuku.mp3 buuuu.mp3 MEMOMU.mp3; do
    echo "# Placeholder for $sound - Replace with actual MP3 audio file" > "assets/$sound.placeholder"
done

echo ""
echo "================================"
echo "Placeholder assets created!"
echo "================================"
echo ""
echo "To use real assets:"
echo "1. Replace placeholder files in /assets/ with actual PNG images and MP3 sounds"
echo "2. Remove .placeholder extensions from filenames"
echo "3. Make sure all files listed in assets/README.md are present"
echo ""
echo "The game will load with placeholder assets, but you should replace them"
echo "with proper images and sounds for the full experience."