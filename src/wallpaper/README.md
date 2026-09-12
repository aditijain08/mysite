# reactive-wallpaper

A dependency-free web component that turns an AI-generated video clip into a
desktop wallpaper that reacts to the mouse. Horizontal movement scrubs through
the clip; if the clip is a slow camera orbit, that reads as the viewpoint
following the cursor. A small parallax shift adds depth, the wallpaper drifts
gently when idle, and the smoothed pointer position is published as CSS
variables so your own layers (windows, dock, icons) can parallax the other way.

Frames are pre-extracted at build time and drawn on a canvas, so scrubbing is
frame-accurate with no video-seek stutter.

## Quick start

```bash
npm install
npm run test-clip          # synthetic placeholder clip -> public/wallpaper/source.mp4
npm run frames -- public/wallpaper/source.mp4 public/wallpaper --width 1280
npm run dev                # demo at http://localhost:5178
```

## 1. Make the video

Generate a ~5 s, 16:9, 1080p+ clip with Veo, Kling, Runway or similar. The
prompt that works best:

> A slow, smooth, continuous horizontal camera orbit around [SCENE]. The
> camera moves steadily from left to right around the scene over the full
> clip. Static scene: nothing in the scene moves on its own, no people, no
> animals, no flickering light. Soft, consistent lighting. No cuts, no camera
> shake, no zoom, no speed changes. Photoreal, cinematic, shallow depth of
> field with clear foreground, midground and background elements.
> 16:9, 5 seconds.

Scene ideas for `[SCENE]`:

- a minimal wooden desk by a large window at dusk, a closed laptop, a small
  plant in the foreground, a city skyline softly out of focus through the window
- a quiet abstract room in muted pastel tones with three floating matte
  geometric objects at different distances from the camera, soft gradient walls

Generate two or three takes; orbit smoothness varies.

## 2. Extract frames

```bash
scripts/make-frames.sh input.mp4 public/wallpaper \
  [--frames 90] [--width 1600] [--format avif|webp] [--quality Q] \
  [--start 0.4] [--end 4.6]
```

Requires `ffmpeg`/`ffprobe`. The default format is AVIF (encoded with ffmpeg's
SVT-AV1 or libaom encoder), which is roughly a third the size of WebP for the
same look; `--quality` is then a CRF, default 40. With `--format webp` (or when
ffmpeg has no AV1 encoder) frames are written with ffmpeg's `libwebp` or with
`cwebp` (`brew install webp`), quality 0–100, default 80; JPEG is the last
fallback. Use `--start`/`--end` to trim wobbly ends. Output is
`f_000.avif … f_NNN.avif` plus `manifest.json`:

```json
{ "version": "2026-09-12T18-20-05Z", "width": 1600, "height": 900,
  "count": 90, "pattern": "f_{i:03}.avif" }
```

`version` is appended to every frame URL as a query string, so regenerating
frames never serves stale cached ones. Budget for a photoreal 1600 px frame:
~60 KB as AVIF at CRF 40 (about 5.5 MB for 90 frames) versus ~190 KB as WebP
at quality 80. To trim further use `--quality 48`, `--frames 60`, or
`--width 1280`. AVIF decodes in every current browser (Safari 16+).

## 3. Embed

Build the library (`npm run build` → `dist/reactive-wallpaper.js`), or import
`src/index.js` directly.

```html
<script type="module" src="/reactive-wallpaper.js"></script>

<div id="desktop" style="position:relative">
  <reactive-wallpaper src="/wallpaper/manifest.json"></reactive-wallpaper>
  <!-- your windows, icons, dock… -->
</div>
```

The element fills its parent (`position:absolute; inset:0`) and ignores
pointer events; it listens on `window`, so layers above it never block
scrubbing. Place it as the first child of the desktop container.

### React

```jsx
import 'reactive-wallpaper';   // side-effect import registers the element

export function Desktop() {
  return (
    <div className="desktop" style={{ position: 'relative' }}>
      <reactive-wallpaper src="/wallpaper/manifest.json" parallax="24" />
      {/* windows… */}
    </div>
  );
}
```

### Attributes

| attribute    | default | meaning |
|--------------|---------|---------|
| `src`        | —       | URL of `manifest.json` (frames are resolved next to it) |
| `ease`       | `0.1`   | easing per 60 fps frame; lower = heavier |
| `parallax`   | `24`    | max shift in CSS px of the wallpaper against the pointer |
| `drift`      | `true`  | slow idle wander when the pointer is still |
| `idle-delay` | `3`     | seconds without movement before drift starts |
| `focus-x`    | `0.5`   | horizontal anchor (0..1) of the cover-fit crop when the frame aspect doesn't match the element, e.g. a 16:9 frame on a phone |
| `focus-y`    | `0.5`   | vertical anchor of the crop |
| `safe-top`   | `0`     | CSS px of chrome over the top edge, such as a menu bar. The frame is fitted below it with its top edge pinned there, so the top of the picture is never hidden; the strip behind the chrome is filled by stretching the frame's top row and the vertical pointer shift is disabled |
| `tilt`       | `auto`  | `auto` arms device-orientation input on touch devices at the first tap; `off` disables it |
| `tilt-range` | `20`    | degrees of phone roll for full left-to-right travel |

All attributes can be changed live.

### Phones: tilt, then touch

On a coarse-pointer device the element waits for the first tap or click and
then asks for device-orientation access (iOS requires that to happen inside a
user gesture; Android and desktop grant it silently). Once readings arrive,
rolling the phone left/right scrubs the clip and pitching it forward/back adds
the vertical parallax; the attitude at the first reading is taken as neutral.
While tilt readings are arriving, touch input is ignored so the two never
fight. If access is denied, unavailable, or readings stop for a second, a
one-finger drag scrubs instead. Call `el.requestTilt()` yourself from a tap
handler to control the moment the permission sheet appears, and
`el.recenterTilt()` to re-take the neutral attitude.

### Events

- `ready` — first frame drawn (fires fast; the middle frame loads first).
- `loaded` — all frames fetched; `detail: { loaded, total }`.
- `error` — manifest failed; `detail.message`. The element stays empty, so
  your desktop's own background shows.

### CSS variables

On every render the element sets `--wp-x` and `--wp-y` (smoothed, −1..1) on
itself **and on its parent element**, so siblings can use them:

```css
.window { transform: translate(calc(var(--wp-x, 0) * -12px),
                               calc(var(--wp-y, 0) * -8px)); }
```

### Read-only properties

`frameCount`, `loadedCount`, `currentFrame`, `position` (`{x, y}`), and
`memoryMode` (`'full'` or `'lru'`).

## Behaviour notes

- **Loading.** Middle frame first (alone, high priority), then quarter points,
  eighths, and so on, six in parallel at low priority. While loading, the
  nearest loaded frame is drawn, so scrubbing works coarsely from the start.
- **Memory.** On devices reporting ≤ 4 GB (`navigator.deviceMemory`) the
  component keeps the WebP blobs and decodes an LRU window of 30 bitmaps
  around the current position; elsewhere every frame is decoded once.
- **Touch and tilt.** Device orientation drives the wallpaper on phones once
  granted (see above); a one-finger drag is the fallback.
- **Hidden tab.** The render loop pauses.
- **Failures.** A frame that fails twice is skipped; the nearest-frame rule
  covers the gap.

## Tests

```bash
npm test          # vitest: frame store + input state machine
npm run test:e2e  # playwright: real scrubbing in Chromium + slow-network ready check
```
