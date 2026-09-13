#!/usr/bin/env bash
# Extract an evenly-sampled WebP frame sequence + manifest.json from a video.
#
# usage: scripts/make-frames.sh <input.mp4> <outdir> [--frames N] [--width W]
#                               [--format avif|webp] [--quality Q] [--start S] [--end E]
# defaults: --frames 90 --width 1920 --format avif --quality 26 --preset 2 --start 0 --end <duration>
#           (--quality is CRF for avif, 0-100 for webp/jpeg; --preset is the SVT-AV1 speed, 0 slowest/best)
#
# --quality is a CRF for avif (lower = better, 30-48 sensible; 40 ~ 60 KB at
# 1600 px for a photoreal frame) and a 0-100 quality for webp/jpg (80 default).
# AVIF is roughly a third the size of WebP for the same look. Falls back to
# webp when ffmpeg has no AV1 encoder.
set -euo pipefail

if [ $# -lt 2 ]; then
  sed -n '2,7p' "$0"; exit 1
fi
IN="$1"; OUT="$2"; shift 2
FRAMES=90; WIDTH=1920; FORMAT=avif; QUALITY=""; PRESET=2; START=0; END=""
while [ $# -gt 0 ]; do
  case "$1" in
    --frames) FRAMES="$2"; shift 2;;
    --width) WIDTH="$2"; shift 2;;
    --format) FORMAT="$2"; shift 2;;
    --quality) QUALITY="$2"; shift 2;;
    --preset) PRESET="$2"; shift 2;;
    --start) START="$2"; shift 2;;
    --end) END="$2"; shift 2;;
    *) echo "unknown option $1" >&2; exit 1;;
  esac
done

command -v ffmpeg >/dev/null || { echo "ffmpeg not found" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found" >&2; exit 1; }

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
[ -z "$END" ] && END="$DUR"
SPAN=$(awk -v s="$START" -v e="$END" 'BEGIN{printf "%.6f", e-s}')
FPS=$(awk -v n="$FRAMES" -v d="$SPAN" 'BEGIN{printf "%.6f", n/d}')

mkdir -p "$OUT"
rm -f "$OUT"/f_*.avif "$OUT"/f_*.webp "$OUT"/f_*.jpg "$OUT"/f_*.png

ENCODERS=$(ffmpeg -hide_banner -encoders 2>/dev/null)
AV1=""
for e in libsvtav1 libaom-av1; do echo "$ENCODERS" | grep -q " $e " && { AV1=$e; break; }; done
if [ "$FORMAT" = avif ] && [ -z "$AV1" ]; then
  echo "note: ffmpeg has no AV1 encoder; falling back to webp" >&2; FORMAT=webp
fi

# Pick a route for the requested format.
EXT=$FORMAT
if [ "$FORMAT" = avif ]; then
  ROUTE=avif; QUALITY="${QUALITY:-26}"
elif echo "$ENCODERS" | grep -q ' libwebp '; then
  ROUTE=ffmpeg-webp; QUALITY="${QUALITY:-80}"
elif command -v cwebp >/dev/null; then
  ROUTE=cwebp; QUALITY="${QUALITY:-80}"
else
  ROUTE=jpeg; EXT=jpg; QUALITY="${QUALITY:-80}"
  echo "note: no WebP encoder found (ffmpeg libwebp or cwebp); writing JPEG" >&2
fi

# Sample FRAMES frames evenly across [START, END].
case "$ROUTE" in
  avif)
    ffmpeg -y -loglevel error -ss "$START" -to "$END" -i "$IN" \
      -vf "fps=${FPS},scale=${WIDTH}:-2" \
      -frames:v "$FRAMES" -start_number 0 "$OUT/f_%03d.png"
    # One still AVIF per PNG, encoded in parallel.
    ls "$OUT"/f_*.png | xargs -P "$(sysctl -n hw.ncpu 2>/dev/null || nproc || echo 4)" -I{} sh -c '
      f="{}"; SVT_LOG=1 ffmpeg -y -loglevel error -i "$f" -vf format=yuv420p \
        -c:v '"$AV1"' -crf '"$QUALITY"' -preset '"$PRESET"' -svtav1-params tune=0:still-picture=1 \
        -frames:v 1 -f avif "${f%.png}.avif" && rm -f "$f"';;
  ffmpeg-webp)
    ffmpeg -y -loglevel error -ss "$START" -to "$END" -i "$IN" \
      -vf "fps=${FPS},scale=${WIDTH}:-2" \
      -c:v libwebp -quality "$QUALITY" -compression_level 6 \
      -frames:v "$FRAMES" -start_number 0 "$OUT/f_%03d.webp";;
  cwebp)
    ffmpeg -y -loglevel error -ss "$START" -to "$END" -i "$IN" \
      -vf "fps=${FPS},scale=${WIDTH}:-2" \
      -frames:v "$FRAMES" -start_number 0 "$OUT/f_%03d.png"
    for f in "$OUT"/f_*.png; do
      cwebp -quiet -q "$QUALITY" -m 6 "$f" -o "${f%.png}.webp"
      rm -f "$f"
    done;;
  jpeg)
    ffmpeg -y -loglevel error -ss "$START" -to "$END" -i "$IN" \
      -vf "fps=${FPS},scale=${WIDTH}:-2" \
      -c:v mjpeg -q:v "$(awk -v q="$QUALITY" 'BEGIN{printf "%d", 2+(100-q)*29/100}')" \
      -frames:v "$FRAMES" -start_number 0 "$OUT/f_%03d.jpg";;
esac

COUNT=$(ls "$OUT"/f_*.$EXT | wc -l | tr -d ' ')
DIMS=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUT/f_000.$EXT")
W=${DIMS%x*}; H=${DIMS#*x}
VERSION=$(date -u +%Y-%m-%dT%H-%M-%SZ)

cat > "$OUT/manifest.json" <<JSON
{
  "version": "$VERSION",
  "width": $W,
  "height": $H,
  "count": $COUNT,
  "pattern": "f_{i:03}.$EXT"
}
JSON

TOTAL=$(du -sk "$OUT" | cut -f1)
echo "wrote $COUNT frames (${W}x${H}) to $OUT, $(awk -v k="$TOTAL" 'BEGIN{printf "%.1f", k/1024}') MB"
