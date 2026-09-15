// Types for the reactive-wallpaper web component (see README.md alongside).
// The runtime lives in the .js files next to this file; importing './wallpaper'
// registers the <reactive-wallpaper> element as a side effect.

import type * as React from 'react'

export declare class ReactiveWallpaper extends HTMLElement {
  /** Total frames in the manifest (0 until loaded). */
  readonly frameCount: number
  /** Frames fetched so far. */
  readonly loadedCount: number
  /** Index of the frame currently drawn, or -1. */
  readonly currentFrame: number
  /** Smoothed pointer position, each axis in -1..1. */
  readonly position: { x: number; y: number }
  /** 'full' decodes every frame; 'lru' keeps a window on low-memory devices. */
  readonly memoryMode: 'full' | 'lru' | null
  /** True while device-orientation readings are driving the wallpaper. */
  readonly tilting: boolean
  /** Request device-orientation access (call from a tap handler on iOS). */
  requestTilt(): Promise<boolean>
  /** Treat the phone's current attitude as the neutral position. */
  recenterTilt(): void
}

export interface ReactiveWallpaperAttributes
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  /** URL of manifest.json; frames are resolved next to it. */
  src?: string
  /** Easing per 60 fps frame (default 0.1). Lower = heavier. */
  ease?: number | string
  /** Max wallpaper shift in CSS px against the pointer (default 24). */
  parallax?: number | string
  /** Idle wander when the pointer is still (default true). */
  drift?: boolean | string
  /** Seconds without movement before drift starts (default 3). */
  'idle-delay'?: number | string
  /** Horizontal anchor of the cover-fit crop, 0..1 (default 0.5). */
  'focus-x'?: number | string
  /** Vertical anchor of the cover-fit crop, 0..1 (default 0.5). */
  'focus-y'?: number | string
  /** CSS px of chrome over the top edge (e.g. a menu bar); pins the frame's top edge below it. */
  'safe-top'?: number | string
  /** 'auto' (default) arms device tilt on touch devices at the first tap; 'off' disables it. */
  tilt?: 'auto' | 'off'
  /** Degrees of roll for full left-to-right travel (default 20). */
  'tilt-range'?: number | string
  /** Presence freezes the render loop at the current frame (no reset on resume). */
  paused?: boolean | string
  onready?: (e: CustomEvent) => void
  onloaded?: (e: CustomEvent<{ loaded: number; total: number }>) => void
  onerror?: (e: CustomEvent<{ message: string }>) => void
}

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'reactive-wallpaper': ReactiveWallpaperAttributes
    }
  }
  interface HTMLElementTagNameMap {
    'reactive-wallpaper': ReactiveWallpaper
  }
}
