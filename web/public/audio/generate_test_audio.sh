#!/bin/bash

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg is not installed. Please install it to generate test audio."
    echo "You can install it with brew install ffmpeg on macOS or apt-get install ffmpeg on Linux."
    exit 1
fi

echo "Generating test audio files..."

# Calculate timings for 140 BPM
# 140 BPM = 140 beats per minute = 140/60 = 2.333... beats per second
# One beat duration = 60/140 = 0.429 seconds
BEAT_DURATION=0.429
NOTE_DURATION=0.4  # Slightly shorter than beat duration to create space between notes
PATTERN_LENGTH=8   # 8 beats pattern

# Generate a menu theme at 140 BPM with a repeating pattern
# This creates a simple arpeggio pattern at 140 BPM
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=277:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=330:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=440:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=330:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=277:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=220:duration=$BEAT_DURATION" \
       -f lavfi -i "sine=frequency=165:duration=$BEAT_DURATION" \
       -filter_complex \
       "[0:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a0]; \
        [1:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a1]; \
        [2:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a2]; \
        [3:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a3]; \
        [4:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a4]; \
        [5:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a5]; \
        [6:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a6]; \
        [7:a]atrim=duration=$NOTE_DURATION,apad=pad_dur=$BEAT_DURATION[a7]; \
        [a0][a1][a2][a3][a4][a5][a6][a7]concat=n=8:v=0:a=1[aout]; \
        [aout][aout]concat=n=2:v=0:a=1" \
       -b:a 192k menu-theme.mp3

# Generate a button click sound effect
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=0.1" \
       -af "envelope=attack=0.005:decay=0.1" -b:a 128k button-click.mp3

echo "Test audio files generated successfully!"
echo "menu-theme.mp3 - 140 BPM pattern (8 beats, repeating)"
echo "button-click.mp3 - UI click sound"
echo ""
echo "Note: These are simple placeholder audio files."
echo "For production, replace them with properly designed audio files." 