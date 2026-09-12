import { useState, useEffect, useCallback, useRef } from 'react'
import type { AppId } from '../App'
import { codeProjects, figmaFiles, FILE_KIND_LABEL, PRODUCTS, CANNED, ALBUMS, notesData } from '../App'
import {
  IconCursor, IconFigma, IconNotes, IconAditi, IconClaude, IconMail, IconPDF, IconPhotos, ClaudeMark,
} from './AppIcons'
import { squircleClipPath } from './squircle'
import { glassStyle } from './liquidGlass'
import { useTheme } from '../theme'
import '../wallpaper' // registers <reactive-wallpaper>; see src/wallpaper/README.md
import About from '../pages/About'
import Resume from '../pages/Resume'
import Contact from '../pages/Contact'


// ─── App roster — same 8 apps as the desktop dock, iOS-home-screen order ──────

const APPS: { id: AppId; label: string; icon: (s: number) => React.ReactNode }[] = [
  { id: 'about',  label: 'Aditi',   icon: (s) => <IconAditi size={s} /> },
  { id: 'cursor', label: 'Cursor',  icon: (s) => <IconCursor size={s} /> },
  { id: 'figma',  label: 'Figma',   icon: (s) => <IconFigma size={s} /> },
  { id: 'notes',  label: 'Notes',   icon: (s) => <IconNotes size={s} /> },
  { id: 'mail',   label: 'Mail',    icon: (s) => <IconMail size={s} /> },
  { id: 'resume', label: 'Resume',  icon: (s) => <IconPDF size={s} /> },
  { id: 'claude', label: 'Claude',  icon: (s) => <IconClaude size={s} /> },
  { id: 'photos', label: 'Photos',  icon: (s) => <IconPhotos size={s} /> },
]

const DOCK_IDS: AppId[] = ['about', 'resume', 'mail', 'claude']

const APP_TITLE: Record<AppId, string> = {
  cursor: 'Cursor', figma: 'Figma', notes: 'Notes', about: 'Aditi',
  photos: 'Photos', mail: 'Mail', claude: 'Claude', resume: 'Resume',
}

function SquircleIcon({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <div style={{ width: size, height: size, clipPath: squircleClipPath(size, size), boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
      {children}
    </div>
  )
}

// ─── Status bar + Dynamic Island ────────────────────────────────────────────

function DynamicIsland() {
  return (
    <div style={{
      position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
      width: 126, height: 37, borderRadius: 19, background: '#000',
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    }} />
  )
}

function StatusBar({ dark = true }: { dark?: boolean }) {
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])
  const c = dark ? '#fff' : '#000'
  return (
    <div style={{ position: 'relative', height: 59, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 24px 8px 28px', flexShrink: 0, fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <span style={{ fontSize: '1rem', fontWeight: 600, color: c }}>{clock || '9:41'}</span>
      <DynamicIsland />
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="18" height="12" viewBox="0 0 17 11" fill="none">
          {[0, 1, 2, 3].map(i => (
            <rect key={i} x={i * 4.5} y={9 - i * 2.2} width="3.2" height={2 + i * 2.2} rx="0.6" fill={c} />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 9.5a1 1 0 100 2 1 1 0 000-2z" fill={c}/>
          <path d="M4.5 7C5.6 5.8 6.5 5.2 7.5 5.2s1.9.6 3 1.8" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M1.8 4.5C3.5 2.6 5.4 1.5 7.5 1.5s4 1.1 5.7 3" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
        </svg>
        <svg width="25" height="13" viewBox="0 0 24 12" fill="none">
          <rect x="0.5" y="0.5" width="19" height="11" rx="2.5" stroke={c} strokeWidth="1"/>
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill={c}/>
          <path d="M20.5 4 C21.8 4 22.5 4.7 22.5 6 C22.5 7.3 21.8 8 20.5 8" stroke={c} strokeWidth="1" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Home gesture ───────────────────────────────────────────────────────────
// Real iOS has no back button for leaving an app — you swipe up from the
// home indicator. A quick swipe goes straight home; a swipe that's held (or
// dragged further) opens the App Switcher, mirroring the actual distinction
// iOS makes between the two gestures.
function useHomeGesture(onSwipeUp: (heldOrFar: boolean) => void) {
  const drag = useRef({ active: false, startY: 0, startT: 0 })
  return useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    drag.current = { active: true, startY: e.clientY, startT: Date.now() }
    const up = (ev: PointerEvent) => {
      if (!drag.current.active) return
      drag.current.active = false
      const dy = drag.current.startY - ev.clientY
      const dt = Date.now() - drag.current.startT
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (dy > 36) onSwipeUp(dt > 260 || dy > 140)
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }, [onSwipeUp])
}

function HomeIndicator({ dark = true, onPointerDown, onActivate }: { dark?: boolean; onPointerDown?: (e: React.PointerEvent) => void; onActivate?: () => void }) {
  // The swipe gesture has no pointer-drag equivalent for keyboard/switch
  // users, so Enter/Space on the focused indicator does the simple "go
  // home" action (the same as a quick flick) as a reachable fallback.
  return (
    <button
      onPointerDown={onPointerDown}
      onClick={onActivate}
      aria-label="Go home"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: onPointerDown ? 'grab' : 'default', background: 'none', border: 'none', padding: 0 }}
    >
      <div style={{ width: 134, height: 5, borderRadius: 3, background: dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' }} />
    </button>
  )
}

// ─── Home screen ───────────────────────────────────────────────────────────

function HomeScreenIcon({ app, onOpen }: { app: typeof APPS[0]; onOpen: (id: AppId) => void }) {
  return (
    <button onClick={() => onOpen(app.id)} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', width: 72 }}>
      <SquircleIcon size={60}>{app.icon(60)}</SquircleIcon>
      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 3px rgba(0,0,0,0.6)', fontFamily: '-apple-system, system-ui, sans-serif' }}>{app.label}</span>
    </button>
  )
}

function HomeScreen({ onOpen, onHomeGesture, onGoHome }: { onOpen: (id: AppId) => void; onHomeGesture: (e: React.PointerEvent) => void; onGoHome: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const gridApps = APPS.filter(a => !DOCK_IDS.includes(a.id))
  const dockApps = DOCK_IDS.map(id => APPS.find(a => a.id === id)!)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#05050C', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      {/* Same street clip as the desktop. The 16:9 frame is cropped to the
          phone with the character kept in view (focus-x); the phone's tilt
          scrubs it once the first tap grants motion access, a finger drag
          scrubs it otherwise. */}
      <reactive-wallpaper src="/wallpaper/manifest.json" parallax="14" focus-x="0.62" drift="false" />
      {/* Scrim so the status bar and name stay legible over the photo */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,5,12,0.55) 0%, rgba(5,5,12,0.15) 22%, transparent 45%, rgba(5,5,12,0.45) 100%)', pointerEvents: 'none' }} />

      <StatusBar />

      <div style={{ position: 'relative', padding: '4px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.5625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,108,0.5)', marginBottom: 4 }}>Lead Product Designer · AI-Native</p>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontOpticalSizing: 'none', fontVariationSettings: "'WONK' 0, 'opsz' 20", fontWeight: 300, fontStyle: 'italic', fontSize: '1.375rem', color: 'rgba(232,229,220,0.9)' }}>Aditi Jain Agrawal</p>
        </div>
        {/* Light/dark switch — manual for now; apps that show this site's own
            content (Aditi, Resume, Mail) follow it, the rest stay fixed. */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
          title={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
          style={{ ...glassStyle({ radius: 16 }), width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0, color: 'rgba(232,229,220,0.9)', padding: 0, marginTop: 2 }}
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="4" fill="currentColor"/><g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="8" y1="0.5" x2="8" y2="2.3"/><line x1="8" y1="13.7" x2="8" y2="15.5"/><line x1="0.5" y1="8" x2="2.3" y2="8"/><line x1="13.7" y1="8" x2="15.5" y2="8"/><line x1="2.6" y1="2.6" x2="3.9" y2="3.9"/><line x1="12.1" y1="12.1" x2="13.4" y2="13.4"/><line x1="2.6" y1="13.4" x2="3.9" y2="12.1"/><line x1="12.1" y1="3.9" x2="13.4" y2="2.6"/></g></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 9.3A6.3 6.3 0 016.7 2 6.5 6.5 0 1014 9.3z" fill="currentColor"/></svg>
          )}
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, padding: '28px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '22px 0', alignContent: 'start', justifyItems: 'center' }}>
        {gridApps.map(app => <HomeScreenIcon key={app.id} app={app} onOpen={onOpen} />)}
      </div>

      <div style={{ position: 'relative', padding: '0 14px 8px', flexShrink: 0 }}>
        <div style={{ ...glassStyle({ radius: 26 }), padding: '10px 12px', display: 'flex', justifyContent: 'space-around' }}>
          {dockApps.map(app => (
            <button key={app.id} onClick={() => onOpen(app.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <SquircleIcon size={56}>{app.icon(56)}</SquircleIcon>
            </button>
          ))}
        </div>
      </div>
      <HomeIndicator onPointerDown={onHomeGesture} onActivate={onGoHome} />
    </div>
  )
}

// ─── Chrome: status bar + nav bar float over scrolling content ─────────────

function NavBar({ title, dark, large }: { title: string; dark: boolean; large?: boolean }) {
  const c = dark ? '#EDEAD9' : '#1A1918'
  return (
    <div style={{ ...glassStyle({ dark, radius: 0 }), border: 'none', borderBottom: `0.5px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, boxShadow: 'none' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        {!large && <span style={{ fontSize: '1rem', fontWeight: 600, color: c, fontFamily: '-apple-system, system-ui, sans-serif' }}>{title}</span>}
      </div>
      {large && (
        <div style={{ padding: '0 20px 14px' }}>
          <span style={{ fontSize: '2.125rem', fontWeight: 700, color: c, fontFamily: '-apple-system, system-ui, sans-serif' }}>{title}</span>
        </div>
      )}
    </div>
  )
}

// ─── Work / Design (Cursor + Figma) — polished, glass-consistent, no exact
// native app to clone against so styled as a well-crafted file browser ─────

function MobileWork() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const body4 = isDark ? 'rgba(224,221,214,0.4)' : 'rgba(30,30,30,0.45)'
  const body55 = isDark ? 'rgba(224,221,214,0.55)' : 'rgba(30,30,30,0.6)'
  const body6 = isDark ? 'rgba(224,221,214,0.6)' : 'rgba(30,30,30,0.65)'
  const body85 = isDark ? 'rgba(224,221,214,0.85)' : 'rgba(30,30,30,0.85)'
  const body35 = isDark ? 'rgba(224,221,214,0.35)' : 'rgba(30,30,30,0.4)'
  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {codeProjects.map(p => (
        <div key={p.file} style={{ ...glassStyle({ radius: 16, dark: isDark }), padding: '18px 18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <p style={{ fontSize: '1.0625rem', color: p.color, fontFamily: "'DM Mono', monospace" }}>{p.file}</p>
          </div>
          <p style={{ fontSize: '0.75rem', color: body55, marginBottom: 10 }}>{p.company}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {p.tags.map(t => (
              <span key={t} style={{ fontSize: '0.6875rem', color: p.color, border: `1px solid ${p.color}44`, borderRadius: 6, padding: '2px 8px' }}>{t}</span>
            ))}
          </div>
          <p style={{ fontSize: '0.875rem', color: body55, lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>{p.description}</p>

          <p style={{ fontSize: '0.6875rem', color: body4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Outcome</p>
          <p style={{ fontSize: '0.9375rem', color: body85, lineHeight: 1.55, marginBottom: 14 }}>{p.outcome}</p>

          {p.problem && (
            <>
              <p style={{ fontSize: '0.6875rem', color: body4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Problem</p>
              <p style={{ fontSize: '0.9375rem', color: body85, lineHeight: 1.55, marginBottom: 14 }}>{p.problem}</p>
            </>
          )}

          {p.process && (
            <>
              <p style={{ fontSize: '0.6875rem', color: body4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Process</p>
              {([
                ['intentMapping', 'Intent mapping'],
                ['decisionFlow', 'Decision flow'],
                ['edgeCases', 'Edge cases'],
              ] as const).map(([key, label]) => (
                <div key={key} style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${p.color}33` }}>
                  <p style={{ fontSize: '0.75rem', color: p.color, marginBottom: 2 }}>{label}</p>
                  {p.process![key] ? (
                    <p style={{ fontSize: '0.875rem', color: body6 }}>{p.process![key]}</p>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: body35, fontStyle: 'italic' }}>Not documented yet</p>
                  )}
                </div>
              ))}
            </>
          )}

          <p style={{ fontSize: '0.6875rem', color: body4, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10, marginBottom: 6 }}>{p.process ? 'Solution' : 'What I built'}</p>
          {p.detail.map((d, i) => (
            <p key={i} style={{ fontSize: '0.875rem', color: body6, lineHeight: 1.5, marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid ${p.color}33` }}>{d}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

// Recent-files browser over the real Birdeye Figma files — matches the
// desktop Figma window's grid + summary. Real URLs are filled in per-entry
// as they're gathered ("Copy link" on each file in Figma); until then,
// tapping a card just selects it instead of opening anything.
function MobileDesign() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [active, setActive] = useState(0)
  const file = figmaFiles[active]
  const heading = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(30,30,30,0.45)'
  const cardEnd = isDark ? '#1E1E1E' : '#EBEBEB'
  const nameColor = isDark ? '#EDEDED' : '#1E1E1E'
  const desc = isDark ? 'rgba(232,229,220,0.75)' : 'rgba(30,30,30,0.75)'
  const dim = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(30,30,30,0.5)'

  const notDocumented = <span style={{ fontStyle: 'italic' }}>Not documented yet</span>

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {PRODUCTS.map(product => {
        const files = figmaFiles.filter(f => f.product === product)
        if (files.length === 0) return null
        return (
          <div key={product} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.75rem', color: heading, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4 }}>{product} · {files.length}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {files.map(f => {
                const i = figmaFiles.indexOf(f)
                return (
                  <button key={f.id} onClick={() => setActive(i)} style={{ ...glassStyle({ radius: 14, dark: isDark }), padding: 0, overflow: 'hidden', textAlign: 'left', border: i === active ? `1.5px solid ${f.color}` : 'none', cursor: 'pointer' }}>
                    <div style={{ aspectRatio: '861 / 481', background: f.coverImage ? undefined : `linear-gradient(135deg, ${f.color}55, ${cardEnd})`, position: 'relative' }}>
                      {f.coverImage && <img src={f.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                      <span style={{ position: 'absolute', top: 6, left: 6, fontSize: '0.5625rem', letterSpacing: '0.04em', color: f.color, background: `${f.color}22`, border: `1px solid ${f.color}55`, borderRadius: 4, padding: '1px 5px' }}>
                        {FILE_KIND_LABEL[f.kind]}
                      </span>
                    </div>
                    <div style={{ padding: '8px 10px 10px' }}>
                      <p style={{ fontSize: '0.8125rem', color: nameColor, fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.name}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Summary of selected project — summary, outcome, duration */}
      <div style={{ ...glassStyle({ radius: 14, dark: isDark }), padding: 16 }}>
        <p style={{ fontSize: '0.6875rem', color: '#C9A86C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {file.product}{file.productUnconfirmed && <span style={{ color: dim, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}> (unconfirmed)</span>}
        </p>
        <span style={{ fontSize: '0.6875rem', color: file.color, border: `1px solid ${file.color}44`, borderRadius: 6, padding: '2px 8px' }}>{FILE_KIND_LABEL[file.kind]}</span>
        <p style={{ fontSize: '0.9375rem', color: nameColor, fontWeight: 500, margin: '10px 0 12px' }}>{file.name}</p>

        <p style={{ fontSize: '0.6875rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Summary</p>
        <p style={{ fontSize: '0.8125rem', color: file.summary ? desc : dim, lineHeight: 1.5, marginBottom: 10 }}>{file.summary ?? notDocumented}</p>

        <p style={{ fontSize: '0.6875rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Outcome</p>
        <p style={{ fontSize: '0.8125rem', color: file.outcome ? desc : dim, lineHeight: 1.5, marginBottom: 10 }}>{file.outcome ?? notDocumented}</p>

        <p style={{ fontSize: '0.6875rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Duration</p>
        <p style={{ fontSize: '0.8125rem', color: file.duration ? desc : dim, lineHeight: 1.5, marginBottom: 12 }}>{file.duration ?? notDocumented}</p>

        {file.url ? (
          <a href={file.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', fontSize: '0.8125rem', color: '#fff', background: file.color, borderRadius: 8, padding: '11px 14px', textDecoration: 'none' }}>
            Take me to the file ↗
          </a>
        ) : (
          <span style={{ fontSize: '0.8125rem', color: dim, fontStyle: 'italic' }}>Link pending</span>
        )}
      </div>
    </div>
  )
}

// ─── Notes — recreates the real iOS 26 Notes app: large title, grouped list,
// search pinned to the BOTTOM (per iOS 26's redesign), glass toolbar ───────

function NoteRow({ n, onOpen, isDark }: { n: typeof notesData[0]; onOpen: () => void; isDark: boolean }) {
  const title = isDark ? '#F5F5F0' : '#000'
  const preview = isDark ? 'rgba(235,235,240,0.6)' : 'rgba(60,60,67,0.6)'
  return (
    <button onClick={onOpen} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, padding: '10px 16px', cursor: 'pointer' }}>
      <p style={{ fontSize: '1.0625rem', color: title, fontWeight: 600, marginBottom: 2, fontFamily: '-apple-system, system-ui, sans-serif' }}>{n.title}</p>
      <p style={{ fontSize: '0.9375rem', color: preview, fontFamily: '-apple-system, system-ui, sans-serif' }}>
        <span style={{ color: preview }}>Today  </span>{n.preview}
      </p>
    </button>
  )
}

function NotesList({ onOpen }: { onOpen: (i: number) => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const bg = isDark ? '#1C1C1E' : '#FBF6E6'
  const rowsBg = isDark ? '#2C2C2E' : '#fff'
  const countText = isDark ? 'rgba(235,235,240,0.5)' : 'rgba(60,60,67,0.5)'
  const searchBg = isDark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)'
  const searchText = isDark ? 'rgba(235,235,240,0.6)' : 'rgba(60,60,67,0.6)'
  return (
    <div style={{ background: bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ margin: '8px 12px 0', borderRadius: 10, overflow: 'hidden', background: rowsBg }}>
          {notesData.map((n, i) => <NoteRow key={n.title} n={n} onOpen={() => onOpen(i)} isDark={isDark} />)}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: countText, marginTop: 10 }}>{notesData.length} Notes</p>
      </div>
      {/* Bottom search bar — iOS 26 moved Notes' search here, always visible */}
      <div style={{ padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}>
        <div style={{ background: searchBg, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={searchText} strokeWidth="1.4"/><line x1="10" y1="10" x2="13.5" y2="13.5" stroke={searchText} strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: '0.9375rem', color: searchText, fontFamily: '-apple-system, system-ui, sans-serif' }}>Search</span>
        </div>
      </div>
    </div>
  )
}

function NoteDetail({ note, onBack }: { note: typeof notesData[0]; onBack: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const bg = isDark ? '#1C1C1E' : '#FBF6E6'
  const dateText = isDark ? 'rgba(235,235,240,0.5)' : 'rgba(60,60,67,0.5)'
  const title = isDark ? '#F5F5F0' : '#000'
  const body = isDark ? '#EDEAD9' : '#1A1918'
  return (
    <div style={{ background: bg, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* In-app back — distinct from the OS-level home gesture, same as
          real Notes' own "‹ Notes" link when leaving a note. */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#C9A86C', fontSize: '0.9375rem', padding: '10px 16px', cursor: 'pointer', display: 'block' }}>‹ Notes</button>
      <div style={{ padding: '4px 20px 40px' }}>
        <p style={{ fontSize: '0.8125rem', color: dateText, marginBottom: 10, fontFamily: '-apple-system, system-ui, sans-serif' }}>Today</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: title, marginBottom: 14, fontFamily: '-apple-system, system-ui, sans-serif' }}>{note.title}</p>
        <p style={{ fontSize: '1.0625rem', color: body, lineHeight: 1.6, whiteSpace: 'pre-line', fontFamily: '-apple-system, system-ui, sans-serif' }}>{note.content}</p>
      </div>
    </div>
  )
}

function MobileNotes() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (openIdx !== null) return <NoteDetail note={notesData[openIdx]} onBack={() => setOpenIdx(null)} />
  return <NotesList onOpen={setOpenIdx} />
}

// ─── Photos — recreates iOS 26's Library / Collections / Search tab bar ───

function PhotosLibrary() {
  const allPhotos = ALBUMS.flatMap(a => a.photos)
  return (
    <div style={{ padding: '2px 2px 70px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        {allPhotos.map((photo, i) => (
          <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
            <img src={photo.src} alt={photo.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PhotosCollections({ onOpenAlbum, isDark }: { onOpenAlbum: (id: string) => void; isDark: boolean }) {
  const text = isDark ? '#F0F0F0' : '#1C1C1E'
  const dim = isDark ? '#98989D' : '#8A8A8E'
  return (
    <div style={{ padding: '4px 16px 70px' }}>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: text, margin: '10px 0 12px', fontFamily: '-apple-system, system-ui, sans-serif' }}>Albums</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {ALBUMS.map(a => (
          <button key={a.id} onClick={() => onOpenAlbum(a.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1', marginBottom: 8 }}>
              <img src={a.cover} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: text }}>{a.title}</p>
            <p style={{ fontSize: '0.75rem', color: dim }}>{a.photos.length} items</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function PhotosAlbumDetail({ albumId, onBack, isDark }: { albumId: string; onBack: () => void; isDark: boolean }) {
  const album = ALBUMS.find(a => a.id === albumId)!
  const accent = isDark ? '#0A84FF' : '#007AFF'
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: accent, fontSize: '0.9375rem', padding: '10px 16px', cursor: 'pointer', display: 'block' }}>‹ Albums</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '0 2px 70px' }}>
        {album.photos.map((photo, i) => (
          <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
            <img src={photo.src} alt={photo.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

const PHOTOS_TABS = [
  { id: 'library', label: 'Library' },
  { id: 'collections', label: 'Collections' },
  { id: 'search', label: 'Search' },
] as const

function MobilePhotos() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [tab, setTab] = useState<typeof PHOTOS_TABS[number]['id']>('library')
  const [albumId, setAlbumId] = useState<string | null>(null)
  const mainBg = isDark ? '#000000' : '#FAFAFA'
  const searchBg = isDark ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)'
  const searchText = isDark ? 'rgba(235,235,240,0.6)' : 'rgba(60,60,67,0.6)'
  const dim = isDark ? '#98989D' : '#8A8A8E'
  const chipText = isDark ? '#F0F0F0' : '#1C1C1E'
  const chipBg = isDark ? '#2C2C2E' : '#fff'
  const chipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const tabIconColor = isDark ? '#F0F0F0' : '#1C1C1E'
  const tabTextInactive = isDark ? 'rgba(235,235,240,0.5)' : 'rgba(28,28,30,0.5)'

  return (
    <div style={{ background: mainBg, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
      {albumId ? (
        <PhotosAlbumDetail albumId={albumId} onBack={() => setAlbumId(null)} isDark={isDark} />
      ) : (
        <>
          {tab === 'library' && <PhotosLibrary />}
          {tab === 'collections' && <PhotosCollections onOpenAlbum={setAlbumId} isDark={isDark} />}
          {tab === 'search' && (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ background: searchBg, borderRadius: 10, padding: '8px 12px', marginBottom: 16 }}>
                <span style={{ fontSize: '0.9375rem', color: searchText }}>Search photos</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: dim, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALBUMS.map(a => <span key={a.id} style={{ fontSize: '0.8125rem', color: chipText, background: chipBg, borderRadius: 16, padding: '6px 14px', border: `1px solid ${chipBorder}` }}>{a.title}</span>)}
              </div>
            </div>
          )}
        </>
      )}

      {/* iOS 26 restored the bottom tab bar for Photos */}
      {!albumId && (
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, padding: '8px 14px calc(8px + env(safe-area-inset-bottom, 0px))' }}>
          <div style={{ ...glassStyle({ dark: isDark, radius: 20 }), display: 'flex', padding: '10px 0' }}>
            {PHOTOS_TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 22, height: 22, opacity: tab === t.id ? 1 : 0.45 }}>
                  {t.id === 'library' && <svg viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="1.5" fill={tabIconColor}/><rect x="12" y="2" width="8" height="8" rx="1.5" fill={tabIconColor} opacity="0.5"/><rect x="2" y="12" width="8" height="8" rx="1.5" fill={tabIconColor} opacity="0.5"/><rect x="12" y="12" width="8" height="8" rx="1.5" fill={tabIconColor} opacity="0.5"/></svg>}
                  {t.id === 'collections' && <svg viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" fill="none" stroke={tabIconColor} strokeWidth="1.6"/><path d="M2 8h18" stroke={tabIconColor} strokeWidth="1.6"/></svg>}
                  {t.id === 'search' && <svg viewBox="0 0 22 22" fill="none"><circle cx="9.5" cy="9.5" r="7" stroke={tabIconColor} strokeWidth="1.8"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke={tabIconColor} strokeWidth="1.8" strokeLinecap="round"/></svg>}
                </div>
                <span style={{ fontSize: '0.625rem', color: tab === t.id ? tabIconColor : tabTextInactive, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ask Me (Claude chat) ────────────────────────────────────────────────

// Claude's own light and dark "paper"/"ink" palettes — matches the desktop
// recreation, since this screen is meant to read as the real Claude app
// (which itself has both appearances), not a generic invert of site chrome.
const CLAUDE_PALETTE = {
  light: { bg: '#FAF9F5', ink: '#3D3929', bubble: '#EDE9DE', clay: '#CC785C', border: 'rgba(0,0,0,0.07)', panel: '#FFFFFF', sendActive: '#30302E', sendIcon: '#FAF9F5', sendIdle: 'rgba(0,0,0,0.08)', sendIdleIcon: '#999' },
  dark:  { bg: '#262624', ink: '#E8E6DC', bubble: '#3B3934', clay: '#CC785C', border: 'rgba(255,255,255,0.08)', panel: '#30302E', sendActive: '#FAF9F5', sendIcon: '#262624', sendIdle: 'rgba(255,255,255,0.08)', sendIdleIcon: '#8C8778' },
}

function MobileClaude() {
  const { theme } = useTheme()
  const c = CLAUDE_PALETTE[theme]
  const [messages, setMessages] = useState<{ role: 'aditi' | 'user'; text: string }[]>([
    { role: 'aditi', text: "Hi! I'm Aditi. Ask me anything about my work, background, or how I design with AI." },
  ])
  const [input, setInput] = useState('')
  const send = useCallback((q: string) => {
    if (!q.trim()) return
    const answer = CANNED[q] ?? "Great question, I'd love to discuss in person. Reach out at aditi8394@gmail.com."
    setMessages(m => [...m, { role: 'user', text: q }, { role: 'aditi', text: answer }])
    setInput('')
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: c.bg }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg, i) => (
          msg.role === 'user' ? (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '85%', background: c.bubble, borderRadius: 18, padding: '10px 14px' }}>
                <p style={{ fontSize: '1rem', color: c.ink, lineHeight: 1.5 }}>{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.clay, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <ClaudeMark size={12} />
              </div>
              <p style={{ fontSize: '1rem', color: c.ink, lineHeight: 1.55, paddingTop: 2 }}>{msg.text}</p>
            </div>
          )
        ))}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, marginLeft: 32 }}>
            {Object.keys(CANNED).map(q => (
              <button key={q} onClick={() => send(q)} style={{ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 999, padding: '10px 15px', fontSize: '0.9375rem', color: c.ink, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>{q}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px calc(10px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: c.panel, border: `1px solid ${c.border}`, borderRadius: 24, padding: '6px 6px 6px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <input aria-label="Reply to Claude" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder="Reply to Claude…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '8px 0', fontSize: '1rem', color: c.ink, fontFamily: 'inherit' }} />
          <button onClick={() => send(input)} aria-label="Send" style={{ width: 32, height: 32, borderRadius: '50%', background: input.trim() ? c.sendActive : c.sendIdle, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5" stroke={input.trim() ? c.sendIcon : c.sendIdleIcon} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared per-app content lookup — reused by the full-screen view AND the
// App Switcher's live mini-previews below ──────────────────────────────────

function appContentFor(id: AppId): React.ReactNode {
  switch (id) {
    case 'about':  return <About navigate={() => {}} />
    case 'resume': return <Resume />
    case 'mail':   return <Contact />
    case 'photos': return <MobilePhotos />
    case 'claude': return <MobileClaude />
    case 'cursor': return <MobileWork />
    case 'figma':  return <MobileDesign />
    case 'notes':  return <MobileNotes />
  }
}

// Every app screen — this site's own (Aditi, Resume, Mail) and the ones that
// recreate a real app's UI (Cursor/VS Code, Figma, Notes, Claude.ai, Photos)
// — follows the light/dark switch, tuned to that app's own appearance.
function appBg(id: AppId, isDark: boolean): string {
  if (id === 'notes') return isDark ? '#1C1C1E' : '#FBF6E6'
  if (id === 'photos') return isDark ? '#000000' : '#FAFAFA'
  if (id === 'claude') return isDark ? '#262624' : '#FAF9F5'
  if (id === 'cursor') return isDark ? '#141414' : '#FFFFFF'
  if (id === 'figma') return isDark ? '#1E1E1E' : '#EBEBEB'
  return isDark ? '#0B0B0A' : '#FAF8F3'
}

// Apps whose content already manages its own scroll/tab chrome shouldn't
// also get the generic scroll wrapper (Photos has its own sticky tab bar;
// Claude is a flex column with its own input bar; Notes pins search to the
// bottom via its own flex layout).
function isSelfManaged(id: AppId): boolean {
  return id === 'photos' || id === 'claude' || id === 'notes'
}

const CHROME_H = 59 + 44

// ─── App detail shell — status bar + nav bar float (glass) over scrolling
// content, like real iOS, instead of sitting in normal flow above it ───────

function MobileAppView({ id, onHomeGesture, onGoHome }: { id: AppId; onHomeGesture: (e: React.PointerEvent) => void; onGoHome: () => void }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const selfManaged = isSelfManaged(id)

  return (
    <div style={{ position: 'fixed', inset: 0, background: appBg(id, dark), overflow: 'hidden' }}>
      {selfManaged ? (
        <div style={{ position: 'absolute', inset: 0, paddingTop: CHROME_H }}>
          {appContentFor(id)}
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ height: CHROME_H }} />
          {appContentFor(id)}
        </div>
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <StatusBar dark={dark} />
        <NavBar title={APP_TITLE[id]} dark={dark} />
      </div>
      <HomeIndicator dark={dark} onPointerDown={onHomeGesture} onActivate={onGoHome} />
    </div>
  )
}

// ─── App Switcher — live scaled-down previews of every open app, exactly
// like iOS: swipe a card up to close it, tap to bring it to front ─────────

const DEVICE_W = 390
const DEVICE_H = 844

function SwitcherCard({ id, onSelect, onClose }: { id: AppId; onSelect: () => void; onClose: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const cardW = 240
  const cardH = 420
  const scale = cardW / DEVICE_W
  const [dragY, setDragY] = useState(0)
  const dragging = useRef({ active: false, startY: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = { active: true, startY: e.clientY }
    const move = (ev: PointerEvent) => {
      if (!dragging.current.active) return
      setDragY(Math.min(0, ev.clientY - dragging.current.startY))
    }
    const up = (ev: PointerEvent) => {
      if (!dragging.current.active) return
      dragging.current.active = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (dragging.current.startY - ev.clientY > 100) onClose()
      else setDragY(0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [onClose])

  const app = APPS.find(a => a.id === id)!
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 18, height: 18, clipPath: squircleClipPath(18, 18) }}>{app.icon(18)}</div>
        <span style={{ fontSize: '0.8125rem', color: '#fff', fontFamily: '-apple-system, system-ui, sans-serif' }}>{app.label}</span>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${app.label}: Enter to open, Delete to close`}
        onPointerDown={onPointerDown}
        onClick={() => dragY === 0 && onSelect()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
          if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onClose() }
        }}
        style={{
          width: cardW, height: cardH, borderRadius: 26, overflow: 'hidden', position: 'relative',
          background: appBg(id, isDark), cursor: 'pointer', touchAction: 'none',
          transform: `translateY(${dragY}px)`, opacity: 1 + dragY / 300,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ width: DEVICE_W, height: DEVICE_H, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
          {isSelfManaged(id) ? (
            <div style={{ position: 'absolute', inset: 0, paddingTop: CHROME_H }}>{appContentFor(id)}</div>
          ) : (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div style={{ height: CHROME_H }} />
              {appContentFor(id)}
            </div>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <StatusBar dark={isDark} />
            <NavBar title={APP_TITLE[id]} dark={isDark} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AppSwitcher({ stack, onSelect, onClose, onHomeGesture, onGoHome }: { stack: AppId[]; onSelect: (id: AppId) => void; onClose: (id: AppId) => void; onHomeGesture: (e: React.PointerEvent) => void; onGoHome: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20, overflowX: 'auto', padding: '20px 24px', WebkitOverflowScrolling: 'touch' }}>
        {stack.length === 0 && (
          <p style={{ margin: 'auto', color: 'rgba(255,255,255,0.4)', fontFamily: '-apple-system, system-ui, sans-serif', fontSize: '0.9375rem' }}>No open apps</p>
        )}
        {stack.map(id => (
          <SwitcherCard key={id} id={id} onSelect={() => onSelect(id)} onClose={() => onClose(id)} />
        ))}
      </div>
      <HomeIndicator onPointerDown={onHomeGesture} onActivate={onGoHome} />
    </div>
  )
}

// ─── Root ───────────────────────────────────────────────────────────────────
// No back button anywhere below — leaving an app is purely the iOS gesture:
// swipe up from the home indicator (quick = go home, held/far = App Switcher).

export default function MobileShell() {
  const [openStack, setOpenStack] = useState<AppId[]>([])
  const [activeApp, setActiveApp] = useState<AppId | null>(null)
  const [mode, setMode] = useState<'home' | 'app' | 'switcher'>('home')

  const openApp = useCallback((id: AppId) => {
    setOpenStack(prev => [id, ...prev.filter(x => x !== id)])
    setActiveApp(id)
    setMode('app')
  }, [])

  const closeApp = useCallback((id: AppId) => {
    setOpenStack(prev => prev.filter(x => x !== id))
    setActiveApp(prev => (prev === id ? null : prev))
  }, [])

  const selectFromSwitcher = useCallback((id: AppId) => {
    setActiveApp(id)
    setMode('app')
  }, [])

  const onHomeGesture = useHomeGesture(useCallback((heldOrFar: boolean) => {
    setMode(current => {
      if (heldOrFar) return openStack.length > 0 ? 'switcher' : 'home'
      return 'home'
    })
  }, [openStack.length]))

  // Keyboard/switch-user fallback for the home indicator (see HomeIndicator) —
  // Enter/Space always does the simple "go home" action, same as a quick flick.
  const goHome = useCallback(() => setMode('home'), [])

  if (mode === 'switcher') {
    return <AppSwitcher stack={openStack} onSelect={selectFromSwitcher} onClose={closeApp} onHomeGesture={onHomeGesture} onGoHome={goHome} />
  }
  if (mode === 'app' && activeApp) {
    return <MobileAppView id={activeApp} onHomeGesture={onHomeGesture} onGoHome={goHome} />
  }
  return <HomeScreen onOpen={openApp} onHomeGesture={onHomeGesture} onGoHome={goHome} />
}
