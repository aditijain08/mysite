#!/usr/bin/env bash
# Render a synthetic 5 s 1280x720 clip that fakes a horizontal camera orbit:
# a soft gradient background with shapes at different "depths" sliding at
# different speeds. Used to seed the demo before a real AI clip exists.
#
# usage: scripts/make-test-clip.sh [out.mp4]
set -euo pipefail
OUT="${1:-public/wallpaper/source.mp4}"
mkdir -p "$(dirname "$OUT")"

# Layers back -> front. Overlay x/y expressions use t = time in seconds, so
# each layer slides at its own speed: far layers slow, near layers fast.
ffmpeg -y -loglevel error \
  -f lavfi -i "gradients=s=1280x720:c0=0x1a1a2e:c1=0x3d2a6e:c2=0x14324a:x0=0:y0=720:x1=1280:y1=0:speed=0:d=5:r=30" \
  -f lavfi -i "color=c=0x6b4fbb:s=380x220:d=5:r=30" \
  -f lavfi -i "color=c=0x98c1d9:s=300x300:d=5:r=30" \
  -f lavfi -i "color=c=0xee6c4d:s=220x220:d=5:r=30" \
  -f lavfi -i "color=c=0xf5c542:s=140x140:d=5:r=30" \
  -f lavfi -i "color=c=0x0b0a12:s=1280x90:d=5:r=30" \
  -filter_complex "
    [0:v][1:v]overlay=x='120+30*t':y=110:shortest=1[a];
    [a][2:v]overlay=x='560+70*t':y=240:shortest=1[b];
    [b][3:v]overlay=x='40+150*t':y=430:shortest=1[c];
    [c][4:v]overlay=x='1000-110*t':y=70:shortest=1[d];
    [d][5:v]overlay=x=0:y=630:shortest=1,format=yuv420p[v]
  " -map "[v]" -c:v libx264 -crf 18 -t 5 "$OUT"
echo "wrote $OUT"
