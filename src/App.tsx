import { useState, useCallback, useEffect, useRef } from 'react'
import DesktopWindow from './components/DesktopWindow'
import MobileShell from './components/MobileShell'
import './wallpaper' // registers <reactive-wallpaper>; see src/wallpaper/README.md
import Process from './pages/Process'
import About from './pages/About'
import Resume from './pages/Resume'
import {
  IconCursor, IconFigma, IconNotes, IconAditi, IconClaude,
  IconMail, IconPDF, IconPhotos, ClaudeMark,
} from './components/AppIcons'
import { squircleClipPath } from './components/squircle'
import { glassStyle } from './components/liquidGlass'
import { useTheme } from './theme'
import {
  cursorProjects, cursorFolderGroups,
  figmaFiles, FILE_KIND_LABEL, PRODUCTS,
  processNotes, PRODUCT_CASE_STUDIES,
} from './content'
import type { Product, ProductCaseStudy } from './content'
export { cursorProjects as codeProjects, figmaFiles, FILE_KIND_LABEL, PRODUCTS, processNotes as notesData }

// ─── Types ────────────────────────────────────────────────────────────────────

export type Page = 'home' | 'work' | 'process' | 'about' | 'contact' | 'resume'
export type AppId = 'cursor' | 'figma' | 'notes' | 'about' | 'mail' | 'claude' | 'resume' | 'photos'

interface WinState { open: boolean; zIndex: number }

const BASE_Z = 10

// ─── Wallpaper choice ────────────────────────────────────────────────────────
// 'video': the AI-generated street clip in public/wallpaper, scrubbed by the
//          cursor (see src/wallpaper/README.md to regenerate it from a new clip).
// 'nature': the hand-built dawn/day/dusk/night scene below.
const WALLPAPER: 'video' | 'nature' = 'video'

// ─── Wallpaper: a nature scene that lives on the real clock ────────────────
// Sky + sun/moon shift through dawn/day/dusk/night like macOS Tahoe's own
// dynamic wallpaper; the hill silhouette parallaxes gently with the cursor,
// the desktop analog of iOS's Depth Effect.
function hourToPeriod(hour: number): 'dawn' | 'day' | 'dusk' | 'night' {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

const PERIOD_STYLES: Record<'dawn' | 'day' | 'dusk' | 'night', {
  sky: string; sunColor: string; sunGlow: string; sunX: string; sunY: string; sunSize: number
  stars: boolean; clouds: boolean; cloudColor: string; birds: boolean
  // Hills read as a backlit silhouette at dawn/dusk/night (the sun is low or
  // gone), but need actual lit color at midday — solid black hills under a
  // bright blue sky doesn't make sense. Two extra distant/hazy layers behind
  // hillBack give real atmospheric-perspective depth, like layered mountain
  // ridges fading into haze rather than a single silhouette band.
  hillFront: string; hillMid: string; hillBack: string; hillFar: string; hillFarthest: string; treeColor: string
}> = {
  dawn: {
    sky: 'linear-gradient(180deg, #2D3561 0%, #A85D6B 45%, #E8A468 75%, #F2C98A 100%)',
    sunColor: '#FFE3B0', sunGlow: 'rgba(255,190,140,0.55)', sunX: '18%', sunY: '68%', sunSize: 90,
    stars: false, clouds: true, cloudColor: 'rgba(255,210,190,0.5)', birds: true,
    hillFront: '#04100B', hillMid: '#081712', hillBack: '#0D1F16',
    hillFar: 'rgba(150,110,110,0.45)', hillFarthest: 'rgba(190,150,140,0.3)', treeColor: '#030B06',
  },
  day: {
    sky: 'linear-gradient(180deg, #1C5F8A 0%, #3F8FB8 40%, #8FC3D9 75%, #CFE8EC 100%)',
    sunColor: '#FFF7D6', sunGlow: 'rgba(255,245,200,0.6)', sunX: '50%', sunY: '14%', sunSize: 70,
    stars: false, clouds: true, cloudColor: 'rgba(255,255,255,0.75)', birds: true,
    hillFront: '#2F5C3C', hillMid: '#4A7856', hillBack: '#6B9880',
    hillFar: 'rgba(160,195,175,0.65)', hillFarthest: 'rgba(200,220,205,0.5)', treeColor: '#16301E',
  },
  dusk: {
    sky: 'linear-gradient(180deg, #241B3D 0%, #6B2F52 40%, #C85C3F 70%, #F2A35C 100%)',
    sunColor: '#FFC98A', sunGlow: 'rgba(255,150,90,0.55)', sunX: '80%', sunY: '66%', sunSize: 100,
    stars: false, clouds: true, cloudColor: 'rgba(255,190,160,0.45)', birds: true,
    hillFront: '#04100B', hillMid: '#081712', hillBack: '#0D1F16',
    hillFar: 'rgba(160,90,90,0.45)', hillFarthest: 'rgba(210,130,100,0.3)', treeColor: '#030B06',
  },
  night: {
    sky: 'linear-gradient(180deg, #05070F 0%, #0D1330 45%, #141C3D 100%)',
    sunColor: '#E8ECFF', sunGlow: 'rgba(200,215,255,0.4)', sunX: '72%', sunY: '18%', sunSize: 44,
    stars: true, clouds: false, cloudColor: 'transparent', birds: false,
    hillFront: '#04100B', hillMid: '#081712', hillBack: '#0D1F16',
    hillFar: 'rgba(30,45,80,0.4)', hillFarthest: 'rgba(50,65,110,0.28)', treeColor: '#030B06',
  },
}

const STAR_POSITIONS = [
  { x: '12%', y: '14%' }, { x: '28%', y: '8%' }, { x: '42%', y: '22%' },
  { x: '58%', y: '10%' }, { x: '20%', y: '30%' }, { x: '88%', y: '12%' },
  { x: '35%', y: '38%' }, { x: '48%', y: '30%' }, { x: '8%', y: '40%' },
]

// Each cloud is a small cluster of overlapping circles ("puffs") rather than
// a single blurred blob, so it actually reads as a cloud shape.
const CLOUD_PUFFS = [
  { dx: 0, dy: 12, size: 26 }, { dx: 14, dy: 2, size: 36 },
  { dx: 32, dy: 10, size: 30 }, { dx: 48, dy: 6, size: 20 },
]

const CLOUD_POSITIONS = [
  { x: '8%',  y: '16%', scale: 1,    drift: 90 },
  { x: '38%', y: '8%',  scale: 0.7,  drift: 120 },
  { x: '60%', y: '22%', scale: 1.15, drift: 75 },
]

// Small pine-tree silhouettes standing on the nearest hill ridge, for texture.
const TREE_POSITIONS = [
  { x: '6%', scale: 0.8 }, { x: '13%', scale: 1.1 }, { x: '19%', scale: 0.7 },
  { x: '30%', scale: 1 },  { x: '63%', scale: 0.9 }, { x: '70%', scale: 1.2 },
  { x: '77%', scale: 0.75 }, { x: '84%', scale: 1 },
]

const BIRD_POSITIONS = [
  { x: '30%', y: '30%', duration: 22, delay: 0,   size: 18 },
  { x: '35%', y: '26%', duration: 26, delay: 1.5, size: 12 },
  { x: '66%', y: '35%', duration: 19, delay: 0.8, size: 24 },
  { x: '20%', y: '22%', duration: 24, delay: 2.2, size: 10 },
]

// Fireflies drifting near the tree line, night only.
const FIREFLY_POSITIONS = [
  { x: '15%', y: '82%', delay: 0 }, { x: '45%', y: '86%', delay: 1.2 },
  { x: '68%', y: '80%', delay: 2.4 }, { x: '80%', y: '88%', delay: 0.6 },
]

// ─── Code work window content (Myna: Frontdesk + Inbox, Search AI) ────────────
// Content lives in src/content/cursor-projects.ts, imported above as `cursorProjects`.

function CursorWindowContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [openFiles, setOpenFiles] = useState<string[]>([cursorProjects[0].file])
  const [active, setActive] = useState<string>(cursorProjects[0].file)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'
  const dim = isDark ? '#555' : '#9a9a9a'
  const text = isDark ? '#E0DDD6' : '#1E1E1E'
  const treeBg = isDark ? '#131313' : '#F3F3F3'
  const editorBg = isDark ? '#141414' : '#FFFFFF'
  const tabsBg = isDark ? '#1A1A1A' : '#ECECEC'
  const treeInactive = isDark ? 'rgba(232,229,220,0.4)' : 'rgba(30,30,30,0.4)'
  const body55 = isDark ? 'rgba(224,221,214,0.55)' : 'rgba(30,30,30,0.6)'
  const body6 = isDark ? 'rgba(224,221,214,0.6)' : 'rgba(30,30,30,0.65)'
  const body8 = isDark ? 'rgba(224,221,214,0.8)' : 'rgba(30,30,30,0.82)'
  const proj = cursorProjects.find(p => p.file === active)

  const openFile = (file: string) => {
    setOpenFiles(fs => fs.includes(file) ? fs : [...fs, file])
    setActive(file)
  }
  const closeFile = (e: React.MouseEvent, file: string) => {
    e.stopPropagation()
    setOpenFiles(fs => {
      const next = fs.filter(f => f !== file)
      if (active === file) setActive(next.length ? next[next.length - 1] : '')
      return next
    })
  }
  const toggleGroup = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const treeItem = (p: typeof cursorProjects[0], indent: number) => (
    <div key={p.file} onClick={() => openFile(p.file)}
      style={{ padding: `3px 12px 3px ${indent}px`, fontSize: '0.6875rem', color: active === p.file ? p.color : treeInactive, background: active === p.file ? `${p.color}12` : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '0.625rem' }}>📝</span>
      <span>{p.file}</span>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '168px 1fr', height: '100%', fontFamily: "'DM Mono', monospace" }}>
      {/* File tree */}
      <div style={{ background: treeBg, borderRight: `1px solid ${border}`, overflowY: 'auto' }}>
        <div style={{ padding: '10px 12px 6px' }}>
          <span style={{ fontSize: '0.625rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Work</span>
        </div>
        {cursorFolderGroups.map(group => {
          const isCollapsed = collapsed[group.id]
          return (
            <div key={group.id}>
              <div onClick={() => toggleGroup(group.id)}
                style={{ padding: '3px 12px', fontSize: '0.6875rem', color: treeInactive, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <span style={{ fontSize: '0.625rem' }}>{isCollapsed ? '▶' : '▼'}</span>
                <span>{group.label}</span>
              </div>
              {!isCollapsed && cursorProjects.filter(p => p.group === group.id).map(p => treeItem(p, 24))}
            </div>
          )
        })}
      </div>
      {/* Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', background: editorBg }}>
        {/* Tabs — horizontally scrollable, only currently-open files, each closable */}
        <div style={{ background: tabsBg, display: 'flex', borderBottom: `1px solid ${border}`, flexShrink: 0, overflowX: 'auto' }}>
          {openFiles.map((file) => {
            const p = cursorProjects.find(cp => cp.file === file)!
            const isActive = active === file
            return (
              <div key={file} onClick={() => setActive(file)} style={{ padding: '5px 8px 5px 14px', fontSize: '0.625rem', color: isActive ? text : dim, borderRight: `1px solid ${border}`, background: isActive ? editorBg : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? p.color : 'transparent', border: isActive ? 'none' : `1px solid ${dim}` }} />
                {p.file}
                <button
                  onClick={(e) => closeFile(e, file)}
                  aria-label={`Close ${p.file}`}
                  style={{ background: 'none', border: 'none', color: dim, cursor: 'pointer', padding: '0 0 0 2px', fontSize: '0.75rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                >×</button>
              </div>
            )
          })}
        </div>
        {/* Document */}
        {proj ? (
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, lineHeight: 1.7 }}>
            <p style={{ fontSize: '0.8125rem', color: proj.color, marginBottom: 4 }}>{`# ${proj.name}`}</p>
            <p style={{ fontSize: '0.6875rem', color: dim, marginBottom: 12 }}>{proj.company}</p>
            <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
              {proj.tags.map((t) => (
                <span key={t} style={{ fontSize: '0.625rem', color: proj.color, border: `1px solid ${proj.color}44`, borderRadius: 3, padding: '1px 6px' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: body6, marginBottom: 16, fontStyle: 'italic' }}>{proj.description}</p>

            <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>## Outcome</p>
            <p style={{ fontSize: '0.875rem', color: body8, marginBottom: 14 }}>{proj.outcome}</p>

            {proj.problem && (
              <>
                <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>## Problem</p>
                <p style={{ fontSize: '0.875rem', color: body8, marginBottom: 14 }}>{proj.problem}</p>
              </>
            )}

            {proj.process && (
              <>
                <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>## Process</p>
                {([
                  ['intentMapping', 'Intent mapping'],
                  ['decisionFlow', 'Decision flow'],
                  ['edgeCases', 'Edge cases'],
                ] as const).map(([key, label]) => (
                  <div key={key} style={{ marginBottom: 10, paddingLeft: 8, borderLeft: `1px solid ${proj.color}33` }}>
                    <p style={{ fontSize: '0.6875rem', color: proj.color, marginBottom: 2 }}>{label}</p>
                    {proj.process![key] ? (
                      <p style={{ fontSize: '0.8125rem', color: body55 }}>{proj.process![key]}</p>
                    ) : (
                      <p style={{ fontSize: '0.8125rem', color: dim, fontStyle: 'italic' }}>Not documented yet</p>
                    )}
                  </div>
                ))}
              </>
            )}

            <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{proj.process ? '## Solution' : '## What I built'}</p>
            {proj.detail.map((d, i) => (
              <p key={i} style={{ fontSize: '0.8125rem', color: body55, marginBottom: 5, paddingLeft: 8, borderLeft: `1px solid ${proj.color}33` }}>{d}</p>
            ))}
            <a href={proj.linkUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', fontSize: '0.75rem', color: proj.color, marginTop: 16, textDecoration: 'none', borderBottom: `1px solid ${proj.color}55` }}>
              {proj.linkLabel ?? 'View project'} ↗
            </a>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: dim }}>No file open</p>
          </div>
        )}
        {/* Status bar */}
        <div style={{ borderTop: `1px solid ${border}`, padding: '3px 14px', display: 'flex', gap: 16, flexShrink: 0 }}>
          {['main', 'UTF-8', 'Markdown'].map((s, i) => (
            <span key={i} style={{ fontSize: '0.625rem', color: dim }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Figma work window content — a recent-files browser over the real
// Birdeye Figma files ────────────────────────────────────────────────────
// Content lives in src/content/figma-files.ts, imported above as `figmaFiles`.
// Real file URLs are filled in per-entry as they're gathered from Figma
// ("Copy link" on each file) — until then, thumbnails just select.

// A thin draggable divider between two panels. `getStart` reads the panel's
// current width when the drag begins (via ref, so it's never stale) and
// `onResize` receives the new width (clamped) on every pointer move, scaled
// by `dir` so dragging away from the panel always grows it.
function ColumnResizer({ getStart, onResize, dir, min, max }: { getStart: () => number; onResize: (w: number) => void; dir: 1 | -1; min: number; max: number }) {
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = getStart()
    const move = (ev: MouseEvent) => {
      const next = startWidth + (ev.clientX - startX) * dir
      onResize(Math.min(max, Math.max(min, next)))
    }
    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      style={{ width: 6, marginLeft: -3, marginRight: -3, cursor: 'col-resize', zIndex: 2, position: 'relative' }}
    />
  )
}

// RHS summary panel is hidden for now — flip to bring it back.
const SHOW_RHS = false

// The canvas artboards shown for whichever page (product) is selected.
const CASE_STUDY_SECTIONS: { key: keyof ProductCaseStudy; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'outcome', label: 'Outcome' },
]

function FigmaWindowContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [active, setActive] = useState(0)
  const [activePage, setActivePage] = useState<Product>(figmaFiles[0].product)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  // Draggable LHS/RHS panel widths — canvas takes the remaining space.
  const [lhsWidth, setLhsWidth] = useState(176)
  const [rhsWidth, setRhsWidth] = useState(200)
  const lhsWidthRef = useRef(lhsWidth)
  const rhsWidthRef = useRef(rhsWidth)
  lhsWidthRef.current = lhsWidth
  rhsWidthRef.current = rhsWidth
  const file = figmaFiles[active]
  const panelBg = isDark ? '#1E1E1E' : '#F5F5F5'
  const canvas = isDark ? '#111' : '#E5E5E5'
  const dim = isDark ? '#666' : '#9a9a9a'
  const text = isDark ? '#E6E6E6' : '#1E1E1E'
  const frameBg = isDark ? '#1E1E1E' : '#FFFFFF'
  const purple = '#9747FF'
  const borderSoft = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'
  const borderMed = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'
  const borderPanel = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)'
  const propBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const propBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const body6 = isDark ? 'rgba(232,229,220,0.6)' : 'rgba(30,30,30,0.65)'

  const toggleProduct = (p: string) => setCollapsed(c => ({ ...c, [p]: !c[p] }))
  const caseStudy: ProductCaseStudy = PRODUCT_CASE_STUDIES[activePage] ?? {}

  return (
    <div style={{ display: 'grid', gridTemplateColumns: SHOW_RHS ? `${lhsWidth}px 6px 1fr 6px ${rhsWidth}px` : `${lhsWidth}px 6px 1fr`, height: '100%', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      {/* Pages & Layers — each product is a page; selecting one filters the canvas to that project's artboards */}
      <div style={{ background: panelBg, borderRight: `1px solid ${borderPanel}`, overflowY: 'auto' }}>
        <div style={{ height: 36, display: 'flex', borderBottom: `1px solid ${borderSoft}`, padding: '0 4px', alignItems: 'center', flexShrink: 0 }}>
          {['Pages', 'Layers'].map((t, i) => (
            <div key={t} style={{ padding: '6px 10px', fontSize: '0.6875rem', color: i === 0 ? text : dim, borderBottom: i === 0 ? `2px solid ${purple}` : '2px solid transparent' }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: '4px 0 80px' }}>
          {PRODUCTS.map(product => {
            const files = figmaFiles.filter(f => f.product === product)
            if (files.length === 0) return null
            const isCollapsed = collapsed[product]
            const isActivePage = product === activePage
            return (
              <div key={product}>
                <div onClick={() => { setActivePage(product); setActive(figmaFiles.indexOf(files[0])); toggleProduct(product) }}
                  style={{ padding: '5px 10px', fontSize: '0.6875rem', color: isActivePage ? text : dim, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: isActivePage ? 'rgba(151,71,255,0.12)' : 'transparent' }}>
                  <span style={{ fontSize: '0.5625rem' }}>{isCollapsed ? '▶' : '▾'}</span>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.625rem', fontWeight: isActivePage ? 600 : 400 }}>{product}</span>
                  <span style={{ fontSize: '0.5625rem', color: dim, opacity: 0.7 }}>{files.length}</span>
                </div>
                {!isCollapsed && files.map(f => {
                  const i = figmaFiles.indexOf(f)
                  const isActive = i === active
                  return (
                    <div key={f.id} onClick={() => { setActivePage(f.product); setActive(i) }} title={f.name}
                      style={{ padding: `4px 10px 4px ${isActive ? 24 : 26}px`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: isActive ? 'rgba(151,71,255,0.18)' : 'transparent', borderLeft: isActive ? `2px solid ${purple}` : '2px solid transparent' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 1, background: f.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.6875rem', color: isActive ? text : dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      <ColumnResizer getStart={() => lhsWidthRef.current} onResize={setLhsWidth} dir={1} min={130} max={360} />
      {/* Canvas — a case-study artboard per section (Overview/Problem/Solution/Outcome) for the selected page */}
      <div style={{ background: canvas, position: 'relative', overflow: 'auto' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'} 1px, transparent 1px)`, backgroundSize: '20px 20px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: 18 }}>
          <p style={{ fontSize: '0.6875rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{activePage}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 'clamp(360px, 70%, 900px)' }}>
            {CASE_STUDY_SECTIONS.map(({ key, label }) => {
              const body = caseStudy[key]
              return (
                <div key={key}>
                  <span style={{ fontSize: '0.625rem', color: dim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <div style={{ background: frameBg, border: `1px solid ${borderMed}`, borderRadius: 4, padding: 20, aspectRatio: '16 / 9', display: 'flex', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '0.8125rem', color: body ? text : dim, fontStyle: body ? 'normal' : 'italic', lineHeight: 1.6 }}>
                      {body ?? 'Not documented yet'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {SHOW_RHS && (
        <>
          <ColumnResizer getStart={() => rhsWidthRef.current} onResize={setRhsWidth} dir={-1} min={150} max={360} />
          {/* Summary of selected project — summary, outcome, duration */}
          <div style={{ background: panelBg, borderLeft: `1px solid ${borderPanel}`, overflowY: 'auto' }}>
            <div style={{ height: 36, display: 'flex', borderBottom: `1px solid ${borderSoft}`, padding: '0 4px', alignItems: 'center' }}>
              <div style={{ padding: '6px 10px', fontSize: '0.6875rem', color: text, borderBottom: `2px solid ${purple}` }}>Summary</div>
            </div>
            <div style={{ padding: 12 }}>
              <p style={{ fontSize: '0.625rem', color: '#C9A86C', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {file.product}{file.productUnconfirmed && <span style={{ color: dim, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}> (unconfirmed)</span>}
              </p>
              <p style={{ fontSize: '0.875rem', color: text, marginBottom: 6, fontWeight: 500, lineHeight: 1.4 }}>{file.name}</p>
              <span style={{ display: 'inline-block', fontSize: '0.625rem', color: file.color, border: `1px solid ${file.color}44`, borderRadius: 4, padding: '2px 6px', marginBottom: 12 }}>
                {FILE_KIND_LABEL[file.kind]}
              </span>

              <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</p>
              <p style={{ fontSize: '0.8125rem', color: file.summary ? body6 : dim, fontStyle: file.summary ? 'normal' : 'italic', lineHeight: 1.5, marginBottom: 10 }}>
                {file.summary ?? 'Not documented yet'}
              </p>

              <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outcome</p>
              <p style={{ fontSize: '0.8125rem', color: file.outcome ? body6 : dim, fontStyle: file.outcome ? 'normal' : 'italic', lineHeight: 1.5, marginBottom: 10 }}>
                {file.outcome ?? 'Not documented yet'}
              </p>

              <p style={{ fontSize: '0.625rem', color: dim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</p>
              <p style={{ fontSize: '0.8125rem', color: file.duration ? body6 : dim, fontStyle: file.duration ? 'normal' : 'italic', lineHeight: 1.5, marginBottom: 12 }}>
                {file.duration ?? 'Not documented yet'}
              </p>

              {file.url ? (
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: '#fff', background: purple, borderRadius: 6, padding: '9px 12px', textDecoration: 'none', marginBottom: 12 }}>
                  Take me to the file ↗
                </a>
              ) : (
                <div style={{ padding: '8px 10px', background: propBg, border: `1px solid ${propBorder}`, borderRadius: 5, marginBottom: 12 }}>
                  <span style={{ fontSize: '0.75rem', color: dim, fontStyle: 'italic' }}>Link pending</span>
                </div>
              )}
              <p style={{ fontSize: '0.625rem', color: dim }}>{active + 1} of {figmaFiles.length} files</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Claude / Ask Aditi ───────────────────────────────────────────────────────

export const CANNED: Record<string, string> = {
  "What's your strongest AI project?": "Myna, Birdeye's healthcare AI agent. Launched in 2 months, first deal $100K. I designed 4 agents, coded 50+ components, and wrote the Claude Skill that ships a full agent from a single prompt.",
  "How do you work with engineers?": "I raise PRs for smaller tickets directly, do design QA against staging builds, and prototype in code when Figma can't answer the question. Engineers shouldn't need a spec for every pixel.",
  "Tell me about your process": "Design as facilitation, not authorship. I run Google-style Design Sprints, but now they end in a working interface instead of a paper prototype. AI compresses the gap from idea to clickable, not from clickable to right.",
  "What are you looking for?": "IC roles at AI-native companies where design means shipping, not handing off. I want to be in the room where agents are built from the ground up.",
}

type ChatRole = 'aditi' | 'user'
interface ChatMsg { role: ChatRole; text: string }

// Claude's own light and dark "paper"/"ink" palettes — recreates the real
// Claude.ai interface (which itself has both appearances) rather than a
// generic invert of the site's own chrome.
const CLAUDE_PALETTE = {
  light: { bg: '#FAF9F5', ink: '#3D3929', muted: '#8C8778', bubble: '#EDE9DE', clay: '#CC785C', border: 'rgba(0,0,0,0.07)', panel: '#FFFFFF', sendActive: '#30302E', sendIcon: '#FAF9F5', sendIdle: 'rgba(0,0,0,0.08)', sendIdleIcon: '#999' },
  dark:  { bg: '#262624', ink: '#E8E6DC', muted: '#A39E93', bubble: '#3B3934', clay: '#CC785C', border: 'rgba(255,255,255,0.08)', panel: '#30302E', sendActive: '#FAF9F5', sendIcon: '#262624', sendIdle: 'rgba(255,255,255,0.08)', sendIdleIcon: '#8C8778' },
}

function ClaudeWindowContent() {
  const { theme } = useTheme()
  const c = CLAUDE_PALETTE[theme]
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: 'aditi', text: "Hi! I'm Aditi. Ask me anything about my work, background, or how I design with AI." }])
  const [input, setInput] = useState('')

  const send = useCallback((q: string) => {
    if (!q.trim()) return
    const answer = CANNED[q] ?? "Great question, I'd love to discuss in person. Reach out at aditi8394@gmail.com."
    setMessages(m => [...m, { role: 'user' as ChatRole, text: q }, { role: 'aditi' as ChatRole, text: answer }])
    setInput('')
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "-apple-system, system-ui, sans-serif", background: c.bg }}>
      {/* Header — single line: mark, wordmark, model name */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.clay, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClaudeMark size={11} />
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: c.ink }}>Claude</span>
        <span style={{ fontSize: '0.75rem', color: c.muted }}>Sonnet 4.5</span>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg, i) => (
          msg.role === 'user' ? (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '85%', background: c.bubble, borderRadius: 16, padding: '9px 13px' }}>
                <p style={{ fontSize: '0.875rem', color: c.ink, lineHeight: 1.55 }}>{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', gap: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.clay, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <ClaudeMark size={11} />
              </div>
              <p style={{ fontSize: '0.875rem', color: c.ink, lineHeight: 1.6, paddingTop: 1 }}>{msg.text}</p>
            </div>
          )
        ))}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, marginLeft: 29 }}>
            {Object.keys(CANNED).map((q) => (
              <button key={q} onClick={() => send(q)} style={{ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 999, padding: '7px 13px', fontSize: '0.75rem', color: c.ink, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>{q}</button>
            ))}
          </div>
        )}
      </div>
      {/* Input — Claude's rounded composer, attach affordance + send button */}
      <div style={{ padding: '10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: c.panel, border: `1px solid ${c.border}`, borderRadius: 22, padding: '5px 6px 5px 14px' }}>
          <input aria-label="Reply to Claude" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)} placeholder="Reply to Claude…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.8125rem', color: c.ink, fontFamily: 'inherit' }} />
          <button onClick={() => send(input)} aria-label="Send" style={{ width: 26, height: 26, borderRadius: '50%', background: input.trim() ? c.sendActive : c.sendIdle, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5" stroke={input.trim() ? c.sendIcon : c.sendIdleIcon} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Mail / Contact window ─────────────────────────────────────────────────────

function ComposePane({ dim, text, border, isDark }: { dim: string; text: string; border: string; isDark: boolean }) {
  const panelBg = isDark ? '#1C1C1E' : '#FFFFFF'
  const faint = isDark ? 'rgba(224,221,214,0.45)' : 'rgba(30,30,30,0.45)'
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const attachBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
    e.target.value = ''
  }

  const removeFile = (i: number) => setAttachments(prev => prev.filter((_, idx) => idx !== i))

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const fileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext ?? '')) return '🖼'
    if (['pdf'].includes(ext ?? '')) return '📄'
    if (['doc','docx'].includes(ext ?? '')) return '📝'
    if (['zip','rar','gz'].includes(ext ?? '')) return '🗜'
    return '📎'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: panelBg, padding: 20, gap: 0 }}>
      <p style={{ fontSize: '0.6875rem', color: dim, marginBottom: 14, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>New message</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}`, paddingBottom: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '0.75rem', color: dim, width: 32, flexShrink: 0 }}>To:</span>
        <span style={{ fontSize: '0.8125rem', color: '#C9A86C' }}>aditi8394@gmail.com</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}`, paddingBottom: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '0.75rem', color: dim, width: 32, flexShrink: 0 }}>Re:</span>
        <span style={{ fontSize: '0.8125rem', color: faint }}>Let's talk about a role</span>
      </div>
      <div style={{ flex: 1, padding: '10px 0', fontSize: '0.875rem', color: faint, lineHeight: 1.7 }}>
        <p style={{ color: text, marginBottom: 8 }}>Hi Aditi,</p>
        <p>I came across your portfolio and would love to connect about an opportunity...</p>
      </div>

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 10 }}>
          {attachments.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: chipBg, border: `1px solid ${border}`, borderRadius: 6, padding: '4px 8px', maxWidth: 180 }}>
              <span style={{ fontSize: '0.75rem' }}>{fileIcon(f.name)}</span>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.625rem', color: text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{f.name}</p>
                <p style={{ fontSize: '0.625rem', color: dim, margin: 0 }}>{formatSize(f.size)}</p>
              </div>
              <button
                onClick={() => removeFile(i)}
                style={{ background: 'none', border: 'none', color: dim, cursor: 'pointer', fontSize: '0.8125rem', lineHeight: 1, padding: '0 0 0 2px', flexShrink: 0 }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${border}`, alignItems: 'center' }}>
        <a href="mailto:aditi8394@gmail.com" style={{ background: 'rgba(201,168,108,0.14)', border: '1px solid rgba(201,168,108,0.28)', borderRadius: 7, padding: '7px 16px', fontSize: '0.8125rem', color: '#C9A86C', textDecoration: 'none' }}>✉ Send Email</a>
        <input ref={fileInputRef} type="file" multiple onChange={onFiles} style={{ display: 'none' }} />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
          style={{ background: attachBg, border: `1px solid ${border}`, borderRadius: 7, padding: '7px 12px', fontSize: '0.8125rem', color: dim, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10.5 5.5L5.5 10.5C4.1 11.9 1.9 11.9 0.5 10.5C-0.9 9.1 -0.9 6.9 0.5 5.5L5 1C5.9 0.1 7.4 0.1 8.3 1C9.2 1.9 9.2 3.4 8.3 4.3L4 8.6C3.6 9 3 9 2.6 8.6C2.2 8.2 2.2 7.6 2.6 7.2L6.5 3.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Attach
          {attachments.length > 0 && <span style={{ background: 'rgba(201,168,108,0.3)', borderRadius: 8, padding: '0 5px', fontSize: '0.625rem', color: '#C9A86C' }}>{attachments.length}</span>}
        </button>
      </div>
    </div>
  )
}

function MailWindowContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dim = isDark ? '#666' : '#8a8a8a'
  const text = isDark ? '#E0DDD6' : '#1E1E1E'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'
  const sidebarBg = isDark ? '#222' : '#F0F0F0'
  const badgeBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const activeBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const mailboxes = [
    { label: 'Inbox', count: 3 },
    { label: 'Sent', count: 0 },
    { label: 'Drafts', count: 1 },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '148px 1fr', height: '100%', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ background: sidebarBg, borderRight: `1px solid ${border}` }}>
        <div style={{ padding: '10px 10px 6px' }}>
          <p style={{ fontSize: '0.625rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Mailboxes</p>
          {mailboxes.map((s) => (
            <div key={s.label} style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 7, borderRadius: 5, background: 'transparent' }}>
              <span style={{ fontSize: '0.8125rem', color: dim, flex: 1 }}>{s.label}</span>
              {s.count > 0 && <span style={{ fontSize: '0.625rem', background: badgeBg, color: dim, borderRadius: 10, padding: '1px 5px' }}>{s.count}</span>}
            </div>
          ))}
        </div>
        <div style={{ margin: '4px 10px 6px', borderTop: `1px solid ${border}` }} />
        {/* New Message — active */}
        <div style={{ padding: '0 10px 6px' }}>
          <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 7, borderRadius: 5, background: activeBg }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="0.5" y="0.5" width="12" height="12" rx="2" stroke={text} strokeWidth="1"/><path d="M2 4L6.5 7.5L11 4" stroke={text} strokeWidth="1" fill="none"/></svg>
            <span style={{ fontSize: '0.75rem', color: text, flex: 1 }}>New Message</span>
          </div>
        </div>
        <div style={{ padding: '0 10px' }}>
          <p style={{ fontSize: '0.625rem', color: dim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Quick links</p>
          <a href="/resume.pdf" download style={{ display: 'block', fontSize: '0.75rem', color: '#C9A86C', padding: '4px 0', textDecoration: 'none', opacity: 0.8 }}>Resume PDF ↓</a>
        </div>
      </div>
      {/* Compose */}
      <ComposePane dim={dim} text={text} border={border} isDark={isDark} />
    </div>
  )
}

// ─── Notes / Process ──────────────────────────────────────────────────────────
// Content lives in src/content/process-notes.ts, imported above as `processNotes`.

function NotesWindowContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const notes = processNotes
  const [active, setActive] = useState(0)
  const content = processNotes.map(n => n.content)

  const sidebarBg = isDark ? '#242424' : '#EDE6CE'
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const label = isDark ? '#8A8A86' : '#8A7E5E'
  const rowActiveBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const rowTitle = isDark ? '#EDEAD9' : '#2A2520'
  const contentBg = isDark ? '#1C1C1E' : '#FBF6E6'
  const kicker = isDark ? '#8A8A86' : '#B8A878'
  const heading = isDark ? '#EDEAD9' : '#2A2520'
  const bodyText = isDark ? '#C9C6BC' : '#5A5040'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '172px 1fr', height: '100%', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <div style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, overflowY: 'auto' }}>
        <div style={{ padding: '10px 10px 6px' }}>
          <p style={{ fontSize: '0.625rem', color: label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Process Notes</p>
          {notes.map((n, i) => (
            <div key={i} onClick={() => setActive(i)} style={{ padding: '7px 8px', borderRadius: 6, background: i === active ? rowActiveBg : 'transparent', marginBottom: 2, cursor: 'pointer' }}>
              <p style={{ fontSize: '0.8125rem', color: rowTitle, fontWeight: 500, marginBottom: 2 }}>{n.title}</p>
              <p style={{ fontSize: '0.6875rem', color: label, lineHeight: 1.3 }}>{n.preview}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: contentBg, padding: '24px 26px', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.6875rem', color: kicker, marginBottom: 14, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>Process & Philosophy</p>
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontOpticalSizing: 'none', fontVariationSettings: "'WONK' 0, 'opsz' 20", fontWeight: 300, fontSize: '1.5rem', color: heading, marginBottom: 14, lineHeight: 1.15, fontStyle: 'italic' }}>{notes[active].title}</h2>
        {content[active].split('\n\n').map((p, i) => (
          <p key={i} style={{ fontSize: '0.9375rem', color: bodyText, lineHeight: 1.8, marginBottom: 12 }}>{p}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Desktop icon component ────────────────────────────────────────────────────

// Social link icons — open in new tab, styled as .webloc files
// ─── App Icon SVGs ────────────────────────────────────────────────────────────

// ─── Photos window content ────────────────────────────────────────────────────

export const ALBUMS = [
  {
    id: 'sneakers',
    title: 'Sneakers',
    subtitle: 'Custom painted',
    cover: '/photos/aditi-sneaker-greatwave.jpeg',
    photos: [
      { src: '/photos/aditi-sneaker-greatwave.jpeg', caption: 'The Great Wave off Kanagawa' },
      { src: '/photos/sneaker-sistine.jpeg', caption: 'The Creation of Adam' },
      { src: '/photos/sneaker-tennis-bear-guitar.jpeg', caption: 'Tennis, bear, guitar' },
      { src: '/photos/sneaker-panda-popcorn.jpeg', caption: 'Panda, window, popcorn' },
      { src: '/photos/sneaker-vibe.png', caption: 'Vibe' },
      { src: '/photos/sneaker-groovy.png', caption: 'Groovy' },
      { src: '/photos/sneaker-slay.png', caption: 'Slay' },
      { src: '/photos/sneaker-legend.png', caption: 'Legend' },
    ],
  },
  {
    id: 'music',
    title: 'Music',
    subtitle: 'Guitar & vocals',
    cover: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop&auto=format',
    photos: [
      { src: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=800&fit=crop&auto=format', caption: 'Live set' },
      { src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop&auto=format', caption: 'Acoustic session' },
      { src: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=800&fit=crop&auto=format', caption: 'Studio take' },
      { src: 'https://images.unsplash.com/photo-1415886345524-8700be1e3f50?w=800&h=800&fit=crop&auto=format', caption: 'Recording' },
      { src: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800&h=800&fit=crop&auto=format', caption: 'Show night' },
      { src: 'https://images.unsplash.com/photo-1520166012956-add9ba0835cb?w=800&h=800&fit=crop&auto=format', caption: 'Soundcheck' },
    ],
  },
  {
    id: 'photography',
    title: 'Photography',
    subtitle: 'Street & portrait',
    cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&auto=format',
    photos: [
      { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=800&fit=crop&auto=format', caption: 'Street portrait' },
      { src: 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=800&h=800&fit=crop&auto=format', caption: 'Window light' },
      { src: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=800&fit=crop&auto=format', caption: 'Golden hour' },
      { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop&auto=format', caption: 'Natural light' },
      { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop&auto=format', caption: 'Candid' },
      { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=800&fit=crop&auto=format', caption: 'Urban frame' },
    ],
  },
]

function PhotosWindowContent() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const album = ALBUMS.find(a => a.id === activeAlbum)
  const sidebar = isDark ? '#242424' : '#E8E8E8'
  const sidebarText = isDark ? '#F0F0F0' : '#1C1C1E'
  const sidebarDim = isDark ? '#98989D' : '#8A8A8E'
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const mainBg = isDark ? '#000000' : '#FAFAFA'
  const headerBg = isDark ? '#1C1C1E' : '#F5F5F5'
  const headerBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const accent = isDark ? '#0A84FF' : '#007AFF'
  const accentTint = isDark ? 'rgba(10,132,255,0.18)' : 'rgba(0,122,255,0.12)'

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 180, background: sidebar, borderRight: `1px solid ${sidebarBorder}`, flexShrink: 0, overflowY: 'auto', padding: '12px 0' }}>
        <div
          onClick={() => setActiveAlbum(null)}
          style={{ padding: '4px 16px 10px', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: sidebarDim, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Library</p>
          <p style={{ fontSize: '0.875rem', color: activeAlbum === null ? accent : sidebarText, fontWeight: activeAlbum === null ? 600 : 400, padding: '3px 0' }}>All Photos</p>
        </div>
        <div style={{ height: 1, background: sidebarBorder, margin: '0 16px 10px' }} />
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: sidebarDim, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 16px 6px' }}>Albums</p>
        {ALBUMS.map(a => (
          <button
            key={a.id}
            onClick={() => setActiveAlbum(a.id)}
            style={{ width: '100%', background: activeAlbum === a.id ? accentTint : 'none', border: 'none', padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', textAlign: 'left' }}
          >
            <img src={a.cover} alt={a.title} style={{ width: 32, height: 32, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: activeAlbum === a.id ? accent : sidebarText, fontWeight: activeAlbum === a.id ? 600 : 400, margin: 0 }}>{a.title}</p>
              <p style={{ fontSize: '0.6875rem', color: sidebarDim, margin: 0 }}>{a.photos.length} photos</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, overflowY: 'auto', background: mainBg, position: 'relative' }}>
        {/* Album header */}
        {album && (
          <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${headerBorder}`, background: headerBg }}>
            <button onClick={() => setActiveAlbum(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: accent, padding: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              ‹ Albums
            </button>
            <p style={{ fontSize: '1.375rem', fontWeight: 700, color: sidebarText, margin: 0 }}>{album.title}</p>
            <p style={{ fontSize: '0.8125rem', color: sidebarDim, margin: '2px 0 0' }}>{album.subtitle} · {album.photos.length} photos</p>
          </div>
        )}

        {/* Photo grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
          {(album ? album.photos : ALBUMS.flatMap(a => a.photos.slice(0, 2))).map((photo, i) => (
            <div
              key={i}
              onClick={() => setLightbox(i)}
              style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
            >
              <img
                src={photo.src}
                alt={photo.caption}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          ))}
        </div>

        {/* Album grid (all-photos view) */}
        {!album && (
          <div style={{ padding: '20px 20px 8px' }}>
            <p style={{ fontSize: '1.375rem', fontWeight: 700, color: sidebarText, marginBottom: 14 }}>Albums</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {ALBUMS.map(a => (
                <button key={a.id} onClick={() => setActiveAlbum(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <div style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1', marginBottom: 6 }}>
                    <img src={a.cover} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: sidebarText, margin: 0 }}>{a.title}</p>
                  <p style={{ fontSize: '0.75rem', color: sidebarDim, margin: '1px 0 0' }}>{a.photos.length} photos</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox !== null && (() => {
          const photos = album ? album.photos : ALBUMS.flatMap(a => a.photos.slice(0, 2))
          const photo = photos[lightbox]
          return (
            <div
              onClick={() => setLightbox(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <button onClick={e => { e.stopPropagation(); setLightbox(l => l !== null && l > 0 ? l - 1 : l) }}
                aria-label="Previous photo"
                style={{ position: 'absolute', left: 24, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <div onClick={e => e.stopPropagation()} style={{ maxWidth: '80%', maxHeight: '85%', textAlign: 'center' }}>
                <img src={photo.src} alt={photo.caption} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 4 }} />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginTop: 10, fontFamily: '-apple-system, system-ui, sans-serif' }}>{photo.caption} · {lightbox + 1}/{photos.length}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => l !== null && l < photos.length - 1 ? l + 1 : l) }}
                aria-label="Next photo"
                style={{ position: 'absolute', right: 24, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              <button onClick={() => setLightbox(null)}
                aria-label="Close photo"
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'white', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function DesktopIcon({ icon, label, sub, onClick, isFile }: { icon: React.ReactNode; label: string; sub?: string; onClick: () => void; isFile?: boolean }) {
  return (
    <button onDoubleClick={onClick} onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 6, width: 72 }}>
      {/* File icons (resume.pdf) keep their real document silhouette; app
          icons get the current macOS squircle, not a plain rounded rect. */}
      <div style={{
        width: isFile ? 40 : 44, height: isFile ? 50 : 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
        clipPath: isFile ? undefined : squircleClipPath(44, 44),
      }}>{icon}</div>
      <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontFamily: '-apple-system, system-ui, sans-serif', maxWidth: 68, wordBreak: 'break-word' }}>{label}</span>
      {sub && <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.38)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{sub}</span>}
    </button>
  )
}

// ─── Main App — Desktop shell ─────────────────────────────────────────────────

const DOCK_APPS: { id: AppId; label: string }[] = [
  { id: 'cursor', label: 'Cursor'  },
  { id: 'figma',  label: 'Figma'   },
  { id: 'notes',  label: 'Notes'   },
  { id: 'about',  label: 'Aditi'   },
  { id: 'resume', label: 'Resume'  },
  { id: 'mail',   label: 'Mail'    },
  { id: 'claude', label: 'Claude'  },
  { id: 'photos', label: 'Photos'  },
]

function DockIcon({ id }: { id: AppId }) {
  if (id === 'cursor') return <IconCursor size={36} />
  if (id === 'figma')  return <IconFigma  size={36} />
  if (id === 'notes')  return <IconNotes  size={36} />
  if (id === 'about')  return <IconAditi  size={36} />
  if (id === 'photos') return <IconPhotos size={36} />
  if (id === 'claude') return <IconClaude size={36} />
  if (id === 'mail')   return <IconMail   size={36} />
  return <IconPDF size={36} />
}

const APP_LABEL: Record<AppId, string> = {
  cursor: 'Cursor', figma: 'Figma', notes: 'Notes', about: 'Aditi', photos: 'Photos', claude: 'Claude', mail: 'Mail', resume: 'Preview',
}

const MENU_ITEMS: Record<AppId, string[]> = {
  cursor: ['File', 'Edit', 'View', 'Terminal', 'Help'],
  figma:  ['File', 'Edit', 'View', 'Object',   'Help'],
  notes:  ['File', 'Edit', 'View', 'Format',   'Help'],
  about:  ['File', 'Edit', 'View',             'Help'],
  photos: ['File', 'Edit', 'View', 'Image',    'Help'],
  claude: ['File', 'Edit', 'View',             'Help'],
  mail:   ['File', 'Edit', 'View', 'Mailbox',  'Help'],
  resume: ['File', 'Edit', 'View', 'Tools',    'Help'],
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [wins, setWins] = useState<Record<AppId, WinState>>({
    cursor: { open: false, zIndex: BASE_Z },
    figma:  { open: false, zIndex: BASE_Z },
    notes:  { open: false, zIndex: BASE_Z },
    about:  { open: true,  zIndex: BASE_Z + 2 },
    photos: { open: false, zIndex: BASE_Z },
    mail:   { open: false, zIndex: BASE_Z },
    claude: { open: false, zIndex: BASE_Z },
    resume: { open: false, zIndex: BASE_Z },
  })
  const [activeApp, setActiveApp] = useState<AppId | null>('about')
  const [clock, setClock] = useState('')
  // Wallpaper time-of-day — mirrors macOS Tahoe's own dynamic wallpaper
  // (dawn/day/dusk/night, tied to the real clock rather than a fixed look).
  const [period, setPeriod] = useState<'dawn' | 'day' | 'dusk' | 'night'>(() => hourToPeriod(new Date().getHours()))
  const wallpaperRef = useRef<HTMLDivElement>(null)
  const [girlBubbleOpen, setGirlBubbleOpen] = useState(true)
  // Which window (if any) is fullscreen — hides the menu bar/dock like real
  // macOS fullscreen, rather than just filling the space between them.
  const [fullscreenId, setFullscreenId] = useState<AppId | null>(null)
  // A real "Window" menu — lists every open window so one that's drifted
  // behind another (or just been forgotten about) is always one click away.
  const [windowMenuOpen, setWindowMenuOpen] = useState(false)

  // The drag/resize desktop-window metaphor doesn't work on touch/small
  // screens, so below this breakpoint we swap in an iOS-style home screen
  // instead (MobileShell) — same 8 apps, mobile-native full-screen views.
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Close the Window menu on any click elsewhere, matching real menu-bar behavior.
  useEffect(() => {
    if (!windowMenuOpen) return
    const close = () => setWindowMenuOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [windowMenuOpen])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
      setPeriod(hourToPeriod(now.getHours()))
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  // Cursor parallax on the wallpaper — the desktop analog of iOS's Depth
  // Effect. Written straight to a CSS custom property via the ref (not
  // React state) so it tracks at pointer speed without re-rendering.
  useEffect(() => {
    const el = wallpaperRef.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      el.style.setProperty('--cursor-x', `${x}%`)
      el.style.setProperty('--cursor-y', `${y}%`)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const openApp = useCallback((id: AppId) => {
    setWins(w => {
      const maxZ = Math.max(...Object.values(w).map(v => v.zIndex))
      return { ...w, [id]: { open: true, zIndex: maxZ + 1 } }
    })
    setActiveApp(id)
  }, [])

  const closeApp = useCallback((id: AppId) => {
    setWins(w => {
      const next = { ...w, [id]: { ...w[id], open: false } }
      const anyOpen = Object.entries(next).some(([k, v]) => k !== id && v.open)
      if (!anyOpen) setActiveApp(null)
      return next
    })
  }, [])

  const focusApp = useCallback((id: AppId) => {
    setWins(w => {
      const maxZ = Math.max(...Object.values(w).map(v => v.zIndex))
      if (w[id].zIndex === maxZ) return w
      return { ...w, [id]: { ...w[id], zIndex: maxZ + 1 } }
    })
    setActiveApp(id)
  }, [])

  // Adapter so existing page components can navigate
  const navigate = useCallback((page: Page) => {
    const map: Partial<Record<Page, AppId>> = { work: 'cursor', process: 'notes', about: 'about', contact: 'mail', resume: 'resume' }
    if (map[page]) openApp(map[page]!)
  }, [openApp])

  // Right-align near the edge; DesktopWindow clamps this on mount if the
  // viewport is too narrow to fit it there, so no artificial floor is needed.
  const claudeX = typeof window !== 'undefined' ? window.innerWidth - 400 : 1020

  const WIN_CFG: Record<AppId, { w: number; h: number; x: number; y: number; style: import('./components/DesktopWindow').WindowStyle }> = {
    cursor: { w: 700, h: 460, x: 56,       y: 44, style: 'cursor' },
    figma:  { w: 720, h: 460, x: 76,       y: 56, style: 'figma'  },
    notes:  { w: 600, h: 440, x: 66,       y: 52, style: 'notes'  },
    about:  { w: 1040, h: 660, x: 60,       y: 56, style: 'about'  },
    photos: { w: 780, h: 520, x: 72,       y: 50, style: 'photos' },
    mail:   { w: 560, h: 440, x: 96,       y: 62, style: 'mail'   },
    claude: { w: 375, h: 540, x: claudeX,  y: 44, style: 'claude' },
    resume: { w: 660, h: 500, x: 106,      y: 60, style: 'default'},
  }

  const WIN_TITLE: Record<AppId, string> = {
    cursor: 'Cursor',
    figma:  'Figma',
    notes:  'Notes',
    about:  'Aditi.app',
    photos: 'Photos',
    mail:   'Mail',
    claude: 'Ask Aditi',
    resume: 'Aditi_Jain_Agrawal_Resume.pdf',
  }

  if (isMobile) return <MobileShell />

  // Menu bar / dock chrome — the wallpaper stays the same in both themes, but
  // the glass and its text/icons need to read against light glass too.
  const menuText = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(34,30,23,0.88)'
  const menuTextDim = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(34,30,23,0.5)'
  const menuIcon = isDark ? '#fff' : '#2A2520'

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', inset: 0, fontFamily: '-apple-system, system-ui, sans-serif', userSelect: 'none' }}>

      {/* ── Sky — full-bleed behind everything, so the menu bar and dock's ── */}
      {/* Liquid Glass genuinely blurs the scene instead of a flat patch,   */}
      {/* matching how a real macOS wallpaper sits behind the whole screen. */}
      {WALLPAPER === 'video' && (
        // Fills the root; publishes --wp-x / --wp-y on the root for any layer
        // that wants to parallax against it (see src/wallpaper/README.md).
        <reactive-wallpaper src="/wallpaper/manifest.json" parallax="20" drift="false" safe-top={fullscreenId ? 0 : 28} />
      )}
      {WALLPAPER === 'nature' && (
      <div ref={wallpaperRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Sky — shifts through dawn/day/dusk/night on the real clock, like macOS Tahoe's own dynamic wallpaper */}
        <div style={{ position: 'absolute', inset: 0, background: PERIOD_STYLES[period].sky, transition: 'background 1.5s ease' }} />

        {/* Stars — night only */}
        {PERIOD_STYLES[period].stars && STAR_POSITIONS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: s.x, top: s.y, width: 2, height: 2, borderRadius: '50%',
            background: '#fff', opacity: 0.6, animation: `twinkle ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`, pointerEvents: 'none',
          }} />
        ))}

        {/* Sun / moon — repositions per time of day */}
        <div style={{
          position: 'absolute', left: PERIOD_STYLES[period].sunX, top: PERIOD_STYLES[period].sunY,
          width: PERIOD_STYLES[period].sunSize, height: PERIOD_STYLES[period].sunSize,
          transform: 'translate(-50%, -50%)', borderRadius: '50%', background: PERIOD_STYLES[period].sunColor,
          boxShadow: `0 0 ${PERIOD_STYLES[period].sunSize * 1.8}px ${PERIOD_STYLES[period].sunSize * 0.6}px ${PERIOD_STYLES[period].sunGlow}`,
          pointerEvents: 'none', transition: 'left 1.5s ease, top 1.5s ease, background 1.5s ease, box-shadow 1.5s ease',
        }} />

        {/* Clouds — small clusters of overlapping puffs, tinted per time of day */}
        {PERIOD_STYLES[period].clouds && CLOUD_POSITIONS.map((c, ci) => (
          <div key={ci} style={{
            position: 'absolute', left: c.x, top: c.y, pointerEvents: 'none',
            animation: `cloudDrift ${c.drift}s ease-in-out infinite alternate`,
          }}>
            {CLOUD_PUFFS.map((p, pi) => (
              <div key={pi} style={{
                position: 'absolute', left: p.dx * c.scale, top: p.dy * c.scale,
                width: p.size * c.scale, height: p.size * c.scale, borderRadius: '50%',
                background: PERIOD_STYLES[period].cloudColor, transition: 'background 1.5s ease',
              }} />
            ))}
          </div>
        ))}

        {/* Birds — drift across the sky with a wing-flap, daylight hours only */}
        {PERIOD_STYLES[period].birds && BIRD_POSITIONS.map((b, i) => (
          <div key={i} style={{
            position: 'absolute', left: b.x, top: b.y, pointerEvents: 'none',
            animation: `birdFly ${b.duration}s ease-in-out infinite alternate`, animationDelay: `${b.delay}s`,
          }}>
            <svg width={b.size} height={b.size / 2} viewBox="0 0 18 9" style={{ opacity: 0.5, animation: 'birdFlap 0.5s ease-in-out infinite' }}>
              <path d="M0 6 Q4.5 0 9 6 Q13.5 0 18 6" stroke="#1A1410" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}

        {/* Layered mountain ridges — five layers of increasing height/saturation toward
            the front, the two farthest hazy and blending toward the sky for real
            atmospheric-perspective depth, like a real range fading into mist */}
        <svg style={{ position: 'absolute', left: '-10%', bottom: 30, width: '120%', height: 100, pointerEvents: 'none', transform: 'translateX(calc((var(--cursor-x, 50%) - 50%) * -0.008))' }} viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path d="M0,70 Q125,58 250,66 T500,66 T750,66 T1000,66 L1000,100 L0,100 Z" fill={PERIOD_STYLES[period].hillFarthest} />
        </svg>
        <svg style={{ position: 'absolute', left: '-12%', bottom: 12, width: '124%', height: 110, pointerEvents: 'none', transform: 'translateX(calc((var(--cursor-x, 50%) - 50%) * -0.012))' }} viewBox="0 0 1000 110" preserveAspectRatio="none">
          <path d="M0,72 Q125,50 250,64 T500,64 T750,64 T1000,64 L1000,110 L0,110 Z" fill={PERIOD_STYLES[period].hillFar} />
        </svg>
        <svg style={{ position: 'absolute', left: '-15%', bottom: 0, width: '130%', height: 150, pointerEvents: 'none', transform: 'translateX(calc((var(--cursor-x, 50%) - 50%) * -0.015))' }} viewBox="0 0 1000 150" preserveAspectRatio="none">
          <path d="M0,100 Q125,80 250,95 T500,95 T750,95 T1000,95 L1000,150 L0,150 Z" fill={PERIOD_STYLES[period].hillBack} opacity="0.55" />
        </svg>
        <svg style={{ position: 'absolute', left: '-25%', bottom: 0, width: '150%', height: 150, pointerEvents: 'none', transform: 'translateX(calc((var(--cursor-x, 50%) - 50%) * -0.035))' }} viewBox="0 0 1000 150" preserveAspectRatio="none">
          <path d="M0,85 Q125,55 250,78 T500,78 T750,78 T1000,78 L1000,150 L0,150 Z" fill={PERIOD_STYLES[period].hillMid} opacity="0.75" />
        </svg>
        <svg style={{ position: 'absolute', left: '-35%', bottom: 0, width: '170%', height: 150, pointerEvents: 'none', transform: 'translateX(calc((var(--cursor-x, 50%) - 50%) * -0.06))' }} viewBox="0 0 1000 150" preserveAspectRatio="none">
          <path d="M0,70 Q125,30 250,60 T500,60 T750,60 T1000,60 L1000,150 L0,150 Z" fill={PERIOD_STYLES[period].hillFront} />
        </svg>

        {/* Trees, wildflowers, and fireflies — stay put; the birds carry the motion instead */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {TREE_POSITIONS.map((t, i) => (
            <div key={i} style={{
              position: 'absolute', left: t.x, bottom: 78, width: 0, height: 0,
              borderLeft: `${7 * t.scale}px solid transparent`, borderRight: `${7 * t.scale}px solid transparent`,
              borderBottom: `${22 * t.scale}px solid ${PERIOD_STYLES[period].treeColor}`,
            }} />
          ))}
          {/* Fireflies — night only, drifting near the tree line */}
          {PERIOD_STYLES[period].stars && FIREFLY_POSITIONS.map((fl, i) => (
            <div key={i} style={{
              position: 'absolute', left: fl.x, bottom: fl.y, width: 3, height: 3, borderRadius: '50%',
              background: '#FFE9A8', boxShadow: '0 0 6px 2px rgba(255,220,140,0.7)',
              animation: `firefly 4.5s ease-in-out infinite`, animationDelay: `${fl.delay}s`,
            }} />
          ))}

          {/* A rock outcrop, with a small figure standing on top — her greeting is
              open by default (so it stands in for the removed name watermark),
              closable, and clicking her again brings it back */}
          <svg width="60" height="58" viewBox="0 0 60 58" style={{ position: 'absolute', left: '43.5%', bottom: 78, pointerEvents: 'none' }}>
            <path d="M0,58 L6,32 L14,38 L19,14 L26,24 L31,4 L38,20 L46,28 L52,16 L60,58 Z" fill={PERIOD_STYLES[period].hillFront} />
          </svg>
          <div
            onClick={() => setGirlBubbleOpen(true)}
            style={{ position: 'absolute', left: '45%', bottom: 130, width: 24, height: 40, pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <svg width="18" height="30" viewBox="0 0 18 30" style={{ position: 'absolute', bottom: 0, left: 3 }}>
              <circle cx="9" cy="5" r="4" fill={PERIOD_STYLES[period].treeColor} />
              <path d="M9,9 C6,9 5,11 5,13 L3,27 Q9,30 15,27 L13,13 C13,11 12,9 9,9 Z" fill={PERIOD_STYLES[period].treeColor} />
            </svg>
            <div style={{
              position: 'absolute', bottom: 44, left: '50%', transform: `translateX(-50%) translateY(${girlBubbleOpen ? '0' : '4px'})`,
              background: '#FAF9F5', border: '1px solid rgba(201,168,108,0.4)', borderRadius: 8, padding: '5px 24px 5px 10px',
              fontSize: '0.75rem', color: '#3D3929', whiteSpace: 'nowrap', fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic',
              opacity: girlBubbleOpen ? 1 : 0, pointerEvents: girlBubbleOpen ? 'auto' : 'none',
              transition: 'opacity 0.2s ease, transform 0.2s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              Hi there, I'm Aditi
              <button
                onClick={(e) => { e.stopPropagation(); setGirlBubbleOpen(false) }}
                aria-label="Close greeting"
                style={{
                  position: 'absolute', top: 3, right: 4, width: 14, height: 14, borderRadius: '50%',
                  background: 'none', border: 'none', color: '#8C8778', cursor: 'pointer',
                  fontSize: '0.75rem', lineHeight: 1, padding: 0, fontStyle: 'normal',
                }}
              >×</button>
            </div>
          </div>
        </div>

        {/* Film grain */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04 }}>
          <filter id="wGrain"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
          <rect width="100%" height="100%" filter="url(#wGrain)"/>
        </svg>
      </div>
      )}

      {/* ── Menu bar ── */}
      {/* Hidden in fullscreen, matching real macOS — the fullscreen window owns the whole screen. */}
      {!fullscreenId && (
      <div style={{ ...glassStyle({ radius: 0, strong: true, dark: isDark }), border: 'none', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, boxShadow: 'none', height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', position: 'relative', zIndex: 9999, color: menuText }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" style={{ opacity: 0.85, flexShrink: 0 }}>
              <path d="M12.47 9.44c-.02-2.08 1.7-3.08 1.78-3.13-0.97-1.42-2.48-1.61-3.02-1.63-1.29-.13-2.52.76-3.17.76-.65 0-1.66-.74-2.73-.72-1.4.02-2.7.82-3.42 2.08-1.46 2.53-.37 6.28 1.05 8.33.7 1.01 1.53 2.14 2.62 2.1 1.05-.04 1.45-.68 2.72-.68 1.26 0 1.62.68 2.73.66 1.13-.02 1.85-1.03 2.54-2.04.8-1.17 1.13-2.3 1.15-2.36-.03-.01-2.22-.85-2.25-3.37z" fill="currentColor"/>
              <path d="M10.38 3.16c.58-.71.98-1.69.87-2.67-.84.03-1.86.56-2.46 1.26-.54.62-1.01 1.63-.88 2.58.93.07 1.88-.47 2.47-1.17z" fill="currentColor"/>
            </svg>
          <span style={{ fontSize: '0.8125rem', color: menuText, fontWeight: 600 }}>{activeApp ? APP_LABEL[activeApp] : 'Finder'}</span>
          {(activeApp ? MENU_ITEMS[activeApp] : ['File', 'Edit', 'View']).filter(m => m !== 'Help').map((m) => (
            <span key={m} style={{ fontSize: '0.75rem', color: menuTextDim }}>{m}</span>
          ))}
          {/* Window menu — the one item here that's actually interactive */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setWindowMenuOpen(v => !v) }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.75rem', color: windowMenuOpen ? menuText : menuTextDim, fontFamily: 'inherit' }}
            >
              Window
            </button>
            {windowMenuOpen && (
              <div style={{ ...glassStyle({ radius: 8, strong: true, dark: isDark }), position: 'absolute', top: 22, left: 0, minWidth: 200, padding: '5px 0', zIndex: 10000 }}>
                {(Object.entries(wins) as [AppId, WinState][]).filter(([, s]) => s.open).length === 0 && (
                  <div style={{ padding: '6px 14px', fontSize: '0.75rem', color: menuTextDim }}>No open windows</div>
                )}
                {(Object.entries(wins) as [AppId, WinState][])
                  .filter(([, s]) => s.open)
                  .sort(([, a], [, b]) => b.zIndex - a.zIndex)
                  .map(([id]) => (
                    <button
                      key={id}
                      onClick={() => { focusApp(id); setWindowMenuOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8125rem', color: menuText, fontFamily: 'inherit' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ width: 12, textAlign: 'center', opacity: id === activeApp ? 1 : 0 }}>✓</span>
                      {WIN_TITLE[id]}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: menuTextDim }}>Help</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Light/dark switch — manual for now; wallpaper stays the same either way */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
            title={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: menuIcon, opacity: 0.85 }}
          >
            {isDark ? (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="4" fill="currentColor"/><g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="8" y1="0.5" x2="8" y2="2.3"/><line x1="8" y1="13.7" x2="8" y2="15.5"/><line x1="0.5" y1="8" x2="2.3" y2="8"/><line x1="13.7" y1="8" x2="15.5" y2="8"/><line x1="2.6" y1="2.6" x2="3.9" y2="3.9"/><line x1="12.1" y1="12.1" x2="13.4" y2="13.4"/><line x1="2.6" y1="13.4" x2="3.9" y2="12.1"/><line x1="12.1" y1="3.9" x2="13.4" y2="2.6"/></g></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M14 9.3A6.3 6.3 0 016.7 2 6.5 6.5 0 1014 9.3z" fill="currentColor"/></svg>
            )}
          </button>
          {/* Decorative status icons — not real controls, hidden from a11y tree */}
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ opacity: 0.65 }}>
            <circle cx="5.5" cy="5.5" r="4.5" stroke={menuIcon} strokeWidth="1.4"/>
            <line x1="9" y1="9" x2="12.5" y2="12.5" stroke={menuIcon} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <svg aria-hidden="true" width="15" height="11" viewBox="0 0 15 11" fill="none" style={{ opacity: 0.65 }}>
            <rect x="0" y="0" width="6" height="5" rx="1.5" fill={menuIcon}/>
            <rect x="9" y="0" width="6" height="5" rx="1.5" fill={menuIcon}/>
            <rect x="0" y="6" width="6" height="5" rx="1.5" fill={menuIcon}/>
            <rect x="9" y="6" width="6" height="5" rx="1.5" fill={menuIcon}/>
          </svg>
          <svg aria-hidden="true" width="15" height="11" viewBox="0 0 15 11" fill="none" style={{ opacity: 0.65 }}>
            <path d="M7.5 9.5a1 1 0 100 2 1 1 0 000-2z" fill={menuIcon}/>
            <path d="M4.5 7C5.6 5.8 6.5 5.2 7.5 5.2s1.9.6 3 1.8" stroke={menuIcon} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            <path d="M1.8 4.5C3.5 2.6 5.4 1.5 7.5 1.5s4 1.1 5.7 3" stroke={menuIcon} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          </svg>
          <svg aria-hidden="true" width="22" height="11" viewBox="0 0 22 11" fill="none" style={{ opacity: 0.65 }}>
            <rect x="0.5" y="0.5" width="17" height="10" rx="2.5" stroke={menuIcon} strokeWidth="1"/>
            <rect x="2" y="2" width="12" height="7" rx="1.5" fill={menuIcon}/>
            <path d="M18.5 3.5 C19.8 3.5 20.5 4.2 20.5 5.5 C20.5 6.8 19.8 7.5 18.5 7.5" stroke={menuIcon} strokeWidth="1" strokeLinecap="round" fill="none"/>
          </svg>
          {/* Clock */}
          <span style={{ fontSize: '0.75rem', color: menuText, fontFamily: '-apple-system, system-ui, sans-serif', letterSpacing: '0.01em' }}>{clock || '11:42 AM'}</span>
        </div>
      </div>
      )}

      {/* ── Desktop — icons, windows, watermark, positioned within the working area ── */}
      {/* Expands to the full viewport in fullscreen, since the menu bar/dock it normally leaves room for are hidden. Fully transparent — the sky layer behind it shows through. */}
      <div style={{ position: 'absolute', top: fullscreenId ? 0 : 28, left: 0, right: 0, bottom: fullscreenId ? 0 : 72, overflow: 'hidden' }}>
        {/* Desktop icons — 2-column grid, recruiter-journey order */}
        <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 0 }}>
          {/* Column 1: Cursor → About → Notes → Mail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <DesktopIcon icon={<IconCursor />} label="Cursor"    sub="Code work"   onClick={() => openApp('cursor')} />
            <DesktopIcon icon={<IconAditi />}  label="Aditi.app" sub="About"       onClick={() => openApp('about')} />
            <DesktopIcon icon={<IconNotes />}  label="Notes"     sub="Process"     onClick={() => openApp('notes')} />
            <DesktopIcon icon={<IconMail />}   label="Mail"      sub="Contact"     onClick={() => openApp('mail')} />
          </div>
          {/* Column 2: Figma → resume.pdf → Claude → Photos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <DesktopIcon icon={<IconFigma />}  label="Figma"     sub="Design work" onClick={() => openApp('figma')} />
            <div style={{ height: 6 }} />
            <DesktopIcon icon={<IconPDF />}    label="resume.pdf"                  onClick={() => openApp('resume')} isFile />
            <div style={{ height: 6 }} />
            <DesktopIcon icon={<IconClaude />} label="Claude"    sub="Ask me"      onClick={() => openApp('claude')} />
            <DesktopIcon icon={<IconPhotos />} label="Photos"    sub="Creative"    onClick={() => openApp('photos')} />
          </div>
        </div>

        {/* ── Open windows ── */}
        {(Object.entries(wins) as [AppId, WinState][]).map(([id, state]) => {
          if (!state.open) return null
          const cfg = WIN_CFG[id]
          return (
            <DesktopWindow
              key={id}
              title={WIN_TITLE[id]}
              width={cfg.w}
              height={cfg.h}
              initialX={cfg.x}
              initialY={cfg.y}
              zIndex={state.zIndex}
              windowStyle={cfg.style}
              onClose={() => closeApp(id)}
              onFocus={() => focusApp(id)}
              onMaximizeChange={(m) => setFullscreenId(prev => m ? id : (prev === id ? null : prev))}
            >
              {id === 'cursor' && <CursorWindowContent />}
              {id === 'figma'  && <FigmaWindowContent />}
              {id === 'notes'  && <NotesWindowContent />}
              {id === 'about'  && <About navigate={navigate} />}
              {id === 'photos' && <PhotosWindowContent />}
              {id === 'mail'   && <MailWindowContent />}
              {id === 'claude' && <ClaudeWindowContent />}
              {id === 'resume' && <Resume />}
            </DesktopWindow>
          )
        })}
      </div>

      {/* ── Dock ── */}
      {!fullscreenId && (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 7, zIndex: 9998 }}>
        <div style={{ ...glassStyle({ radius: 18, strong: true, dark: isDark }), padding: '6px 10px', display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          {DOCK_APPS.map((app) => {
            const isOpen = wins[app.id].open
            return (
              <div key={app.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <button
                  onClick={() => isOpen ? focusApp(app.id) : openApp(app.id)}
                  title={app.label}
                  style={{ width: isOpen ? 46 : 44, height: isOpen ? 46 : 44, clipPath: squircleClipPath(isOpen ? 46 : 44, isOpen ? 46 : 44), background: isOpen ? 'linear-gradient(135deg, rgba(201,168,108,0.22), rgba(201,168,108,0.07))' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)'), border: isOpen ? '1px solid rgba(201,168,108,0.22)' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', cursor: 'pointer', padding: 0, transition: 'all 0.15s' }}
                >
                  <DockIcon id={app.id} />
                </button>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: isOpen ? (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)') : 'transparent' }} />
              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
