import { useRef, useState, useCallback, useEffect } from 'react'
import { useTheme } from '../theme'

export type WindowStyle = 'cursor' | 'figma' | 'notes' | 'mail' | 'about' | 'claude' | 'photos' | 'finder' | 'default'

interface Props {
  title: string
  width: number
  height: number
  initialX: number
  initialY: number
  zIndex: number
  onClose: () => void
  onFocus: () => void
  children: React.ReactNode
  windowStyle?: WindowStyle
  subtitle?: string
  // Fires when this window enters/exits fullscreen (the green button or a
  // title-bar double-click) so the parent can hide its own menu bar/dock,
  // matching real macOS fullscreen rather than just filling the space
  // between them.
  onMaximizeChange?: (maximized: boolean) => void
}

// Every window style recreates a specific real app (VS Code, Figma, Mail,
// Notes, Claude.ai, Photos) or this site's own content, and each of those
// real apps has its own light and dark appearance — so both chrome sets
// below follow the site's light/dark switch, tuned to look like that app's
// actual light/dark mode rather than a generic invert.
type Chrome = { bar: string; title: string; content: string; border: string }

const CHROME_DARK: Record<WindowStyle, Chrome> = {
  cursor:  { bar: '#1E1E1E', title: '#666', content: '#141414', border: 'rgba(255,255,255,0.08)' },
  figma:   { bar: '#2C2C2C', title: '#888', content: '#1E1E1E', border: 'rgba(255,255,255,0.08)' },
  notes:   { bar: '#242424', title: '#8A8A86', content: '#1C1C1E', border: 'rgba(255,255,255,0.08)' },
  mail:    { bar: '#282828', title: '#777', content: '#1C1C1E', border: 'rgba(255,255,255,0.07)' },
  about:   { bar: '#181818', title: '#666', content: '#111', border: 'rgba(255,255,255,0.07)' },
  claude:  { bar: '#30302E', title: '#A39E93', content: '#262624', border: 'rgba(255,255,255,0.08)' },
  photos:  { bar: '#252525', title: '#A0A0A0', content: '#000000', border: 'rgba(255,255,255,0.08)' },
  finder:  { bar: '#252525', title: '#777', content: '#1A1A1A', border: 'rgba(255,255,255,0.07)' },
  default: { bar: '#252525', title: '#777', content: '#0B0B0A', border: 'rgba(255,255,255,0.07)' },
}

const CHROME_LIGHT: Record<WindowStyle, Chrome> = {
  cursor:  { bar: '#ECECEC', title: '#6E6E6E', content: '#FFFFFF', border: 'rgba(0,0,0,0.08)' },
  figma:   { bar: '#F5F5F5', title: '#8C8C8C', content: '#EBEBEB', border: 'rgba(0,0,0,0.08)' },
  notes:   { bar: '#E8E0C4', title: '#8A7E5E', content: '#FBF6E6', border: 'rgba(0,0,0,0.1)' },
  mail:    { bar: '#F0F0F0', title: '#6E6E6E', content: '#FFFFFF', border: 'rgba(0,0,0,0.08)' },
  about:   { bar: '#EFEAE0', title: '#8A8275', content: '#FAF8F3', border: 'rgba(0,0,0,0.08)' },
  claude:  { bar: '#EEEADF', title: '#8C8778', content: '#FAF9F5', border: 'rgba(0,0,0,0.08)' },
  photos:  { bar: '#F0F0F0', title: '#333', content: '#FAFAFA', border: 'rgba(0,0,0,0.1)' },
  finder:  { bar: '#F0F0F0', title: '#6E6E6E', content: '#FAFAFA', border: 'rgba(0,0,0,0.08)' },
  default: { bar: '#EFEAE0', title: '#8A8275', content: '#FAF8F3', border: 'rgba(0,0,0,0.08)' },
}

// Resize handle size in px
const HANDLE = 6

// Must match the menu bar height and dock area height in App.tsx — a window's
// title bar can never be dragged/resized above the menu bar or below the dock.
const MENU_BAR_H = 28
const DOCK_H = 72
const MIN_W = 320
const MIN_H = 200

export default function DesktopWindow({
  title, width, height, initialX, initialY, zIndex,
  onClose, onFocus, children, windowStyle = 'default', subtitle, onMaximizeChange,
}: Props) {
  // Clamp the starting position in case a caller's initialX/initialY (or the
  // viewport it opens into) would otherwise place the window off-screen.
  const [pos, setPos]     = useState(() => {
    const maxX = Math.max(0, window.innerWidth - width)
    const maxY = Math.max(MENU_BAR_H, window.innerHeight - DOCK_H - height)
    return {
      x: Math.min(Math.max(initialX, 0), maxX),
      y: Math.min(Math.max(initialY, MENU_BAR_H), maxY),
    }
  })
  const [size, setSize]   = useState({ w: width, h: height })
  const [maximized, setMaximized] = useState(false)
  const prevGeom = useRef({ x: initialX, y: initialY, w: width, h: height })

  const drag   = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0, sw: 0, sh: 0 })
  const resize = useRef({ active: false, edge: '', sx: 0, sy: 0, ox: 0, oy: 0, ow: 0, oh: 0 })

  const { theme } = useTheme()
  const c = theme === 'light' ? CHROME_LIGHT[windowStyle] : CHROME_DARK[windowStyle]

  // Mirrored into refs (rather than used as effect deps directly) so the
  // mount/unmount effect below only ever runs once — `onMaximizeChange` is a
  // fresh inline function every render, so depending on it directly would
  // make the "cleanup" fire (and immediately un-maximize) on every re-render.
  const maximizedRef = useRef(maximized)
  maximizedRef.current = maximized
  const onMaximizeChangeRef = useRef(onMaximizeChange)
  onMaximizeChangeRef.current = onMaximizeChange

  // If this window is closed (unmounted) while still fullscreen, make sure
  // the parent's menu bar/dock come back rather than staying hidden forever.
  useEffect(() => () => { if (maximizedRef.current) onMaximizeChangeRef.current?.(false) }, [])

  // ── Maximize / restore ────────────────────────────────────────────────────
  const toggleMaximize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (maximized) {
      setPos({ x: prevGeom.current.x, y: prevGeom.current.y })
      setSize({ w: prevGeom.current.w, h: prevGeom.current.h })
      setMaximized(false)
      onMaximizeChange?.(false)
    } else {
      prevGeom.current = { x: pos.x, y: pos.y, w: size.w, h: size.h }
      // True fullscreen: the parent hides its menu bar/dock and lets this
      // window cover the entire viewport, like real macOS fullscreen.
      setPos({ x: 0, y: 0 })
      setSize({ w: window.innerWidth, h: window.innerHeight })
      setMaximized(true)
      onMaximizeChange?.(true)
    }
    onFocus()
  }, [maximized, pos, size, onFocus, onMaximizeChange])

  // ── Drag title bar ────────────────────────────────────────────────────────
  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    if (maximized) return
    e.preventDefault()
    onFocus()
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, sw: size.w, sh: size.h }

    const move = (ev: MouseEvent) => {
      if (!drag.current.active) return
      const { ox, oy, sw, sh } = drag.current
      const rawX = ox + ev.clientX - drag.current.sx
      const rawY = oy + ev.clientY - drag.current.sy
      const maxX = Math.max(0, window.innerWidth - sw)
      const maxY = Math.max(MENU_BAR_H, window.innerHeight - DOCK_H - sh)
      setPos({
        x: Math.min(Math.max(rawX, 0), maxX),
        y: Math.min(Math.max(rawY, MENU_BAR_H), maxY),
      })
    }
    const up = () => { drag.current.active = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }, [pos, size, onFocus, maximized])

  // ── Resize handles ────────────────────────────────────────────────────────
  const startResize = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (maximized) return
    onFocus()
    resize.current = { active: true, edge, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, ow: size.w, oh: size.h }

    const move = (ev: MouseEvent) => {
      if (!resize.current.active) return
      const dx = ev.clientX - resize.current.sx
      const dy = ev.clientY - resize.current.sy
      const { edge: ed, ox, oy, ow, oh } = resize.current
      let nx = ox, ny = oy, nw = ow, nh = oh

      // Growing east/south can't push the far edge past the viewport/dock.
      if (ed.includes('e')) nw = Math.max(MIN_W, Math.min(ow + dx, window.innerWidth - ox))
      if (ed.includes('s')) nh = Math.max(MIN_H, Math.min(oh + dy, window.innerHeight - DOCK_H - oy))
      // Growing west/north moves the origin too — stop it at the menu bar / left edge.
      if (ed.includes('w')) {
        nw = Math.max(MIN_W, ow - dx)
        nx = ox + ow - nw
        if (nx < 0) { nx = 0; nw = ox + ow }
      }
      if (ed.includes('n')) {
        nh = Math.max(MIN_H, oh - dy)
        ny = oy + oh - nh
        if (ny < MENU_BAR_H) { ny = MENU_BAR_H; nh = oy + oh - MENU_BAR_H }
      }

      setPos({ x: nx, y: ny })
      setSize({ w: nw, h: nh })
    }
    const up = () => { resize.current.active = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }, [pos, size, onFocus, maximized])

  // ── Keyboard equivalents ──────────────────────────────────────────────────
  // Drag/resize were pointer-only; arrow keys on the focused title bar move
  // the window (Shift for a bigger step), and arrow keys on a focused resize
  // handle resize it in that handle's direction — same clamping as the
  // pointer versions, just driven by keydown instead of mousemove.
  const NUDGE = 20
  const onTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (maximized) return
    const step = e.shiftKey ? NUDGE * 5 : NUDGE
    let dx = 0, dy = 0
    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else return
    e.preventDefault()
    onFocus()
    setPos(p => {
      const maxX = Math.max(0, window.innerWidth - size.w)
      const maxY = Math.max(MENU_BAR_H, window.innerHeight - DOCK_H - size.h)
      return {
        x: Math.min(Math.max(p.x + dx, 0), maxX),
        y: Math.min(Math.max(p.y + dy, MENU_BAR_H), maxY),
      }
    })
  }, [maximized, size, onFocus])

  const onHandleKeyDown = useCallback((e: React.KeyboardEvent, edge: string) => {
    if (maximized) return
    const step = e.shiftKey ? NUDGE * 5 : NUDGE
    let dw = 0, dh = 0
    if (e.key === 'ArrowLeft') dw = -step
    else if (e.key === 'ArrowRight') dw = step
    else if (e.key === 'ArrowUp') dh = -step
    else if (e.key === 'ArrowDown') dh = step
    else return
    e.preventDefault()
    onFocus()
    const ox = pos.x, oy = pos.y, ow = size.w, oh = size.h
    let nx = ox, ny = oy, nw = ow, nh = oh
    // 'e'/'w' edges resize horizontally on Left/Right, 'n'/'s' resize
    // vertically on Up/Down; corner handles (e.g. 'se') respond to both.
    if (edge.includes('e')) nw = Math.max(MIN_W, Math.min(ow + dw, window.innerWidth - ox))
    if (edge.includes('w') && dw !== 0) {
      nw = Math.max(MIN_W, ow - dw)
      nx = ox + ow - nw
      if (nx < 0) { nx = 0; nw = ox + ow }
    }
    if (edge.includes('s')) nh = Math.max(MIN_H, Math.min(oh + dh, window.innerHeight - DOCK_H - oy))
    if (edge.includes('n') && dh !== 0) {
      nh = Math.max(MIN_H, oh - dh)
      ny = oy + oh - nh
      if (ny < MENU_BAR_H) { ny = MENU_BAR_H; nh = oy + oh - MENU_BAR_H }
    }
    setPos({ x: nx, y: ny })
    setSize({ w: nw, h: nh })
  }, [maximized, onFocus, pos, size])

  // Keep maximized size in sync if window resizes
  useEffect(() => {
    if (!maximized) return
    const onResize = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [maximized])

  const cursorFor: Record<string, string> = {
    n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
    ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
  }

  const handleStyle = (edge: string): React.CSSProperties => {
    const h = HANDLE
    const base: React.CSSProperties = { position: 'absolute', zIndex: 2, cursor: cursorFor[edge] }
    if (edge === 'n')  return { ...base, top: 0,    left: h,     right: h,    height: h }
    if (edge === 's')  return { ...base, bottom: 0, left: h,     right: h,    height: h }
    if (edge === 'e')  return { ...base, right: 0,  top: h,      bottom: h,   width: h }
    if (edge === 'w')  return { ...base, left: 0,   top: h,      bottom: h,   width: h }
    if (edge === 'ne') return { ...base, top: 0,    right: 0,    width: h,    height: h }
    if (edge === 'nw') return { ...base, top: 0,    left: 0,     width: h,    height: h }
    if (edge === 'se') return { ...base, bottom: 0, right: 0,    width: h,    height: h }
    return                    { ...base, bottom: 0, left: 0,     width: h,    height: h }
  }

  const borderRadius = maximized ? 0 : 10

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x, top: pos.y,
        width: size.w, height: size.h,
        zIndex,
        borderRadius,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: maximized ? 'none' : '0 32px 80px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.1)',
        transition: maximized ? 'none' : undefined,
      }}
      onMouseDown={onFocus}
    >
      {/* Resize handles — only when not maximized. Focusable so arrow keys
          can resize (Shift for a bigger step) as a keyboard equivalent to
          dragging, which otherwise has none. */}
      {!maximized && (['n','s','e','w','ne','nw','se','sw'] as const).map((edge) => (
        <div
          key={edge}
          role="slider"
          aria-label={`Resize ${title} (${edge})`}
          aria-valuetext={`${size.w}×${size.h}`}
          tabIndex={0}
          style={handleStyle(edge)}
          onMouseDown={(e) => startResize(e, edge)}
          onKeyDown={(e) => onHandleKeyDown(e, edge)}
        />
      ))}

      {/* Title bar — focusable so arrow keys can move the window (Shift for
          a bigger step) as a keyboard equivalent to dragging it. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${title} title bar — arrow keys move, double-click or Enter to ${maximized ? 'restore' : 'maximize'}`}
        style={{ height: 36, background: c.bar, display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0, cursor: maximized ? 'default' : 'default', borderBottom: `1px solid ${c.border}`, userSelect: 'none' }}
        onMouseDown={onTitleMouseDown}
        onDoubleClick={toggleMaximize}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMaximize(e as unknown as React.MouseEvent) }
          else onTitleKeyDown(e)
        }}
      >
        {/* Traffic lights — a subtle glossy highlight instead of flat fill,
            closer to the current macOS glass treatment than a plain dot. */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label={`Close ${title}`}
            style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%, #FF8A80 0%, #FF5F57 45%, #E0443E 100%)', border: '0.5px solid rgba(0,0,0,0.2)', boxShadow: 'inset 0 0.5px 1px rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
          />
          <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%, #FFD666 0%, #FEBC2E 45%, #DEA123 100%)', border: '0.5px solid rgba(0,0,0,0.2)', boxShadow: 'inset 0 0.5px 1px rgba(255,255,255,0.5)' }} />
          <button
            onClick={toggleMaximize}
            aria-label={maximized ? `Restore ${title}` : `Maximize ${title}`}
            style={{ width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle at 34% 30%, #6FE87F 0%, #28C840 45%, #1FA134 100%)', border: '0.5px solid rgba(0,0,0,0.2)', boxShadow: 'inset 0 0.5px 1px rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
          />
        </div>
        {/* Title */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: c.title, fontFamily: '-apple-system, system-ui, sans-serif', fontWeight: 500 }}>{title}</span>
          {subtitle && <span style={{ fontSize: '0.625rem', color: c.title, opacity: 0.6, marginLeft: 6 }}>{subtitle}</span>}
        </div>
        {/* Spacer to balance traffic lights */}
        <div style={{ width: 52 }} />
      </div>

      {/* Content — keeps the real scrollbar (see index.css) so there's a
          visible cue this window has more content than fits. */}
      <div style={{ flex: 1, background: c.content, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}
