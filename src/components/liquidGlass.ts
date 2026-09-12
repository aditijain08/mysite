// Shared Liquid Glass material recreation — used by both the macOS desktop
// shell (App.tsx, menu bar/dock) and the iOS mobile shell (MobileShell.tsx),
// since it's the same design language (Tahoe 26 / iOS 26) on both platforms.
// A blurred, saturated backdrop with a bright specular highlight along the
// top edge and a soft outer shadow — reads as floating glass, not a flat
// tinted panel.
export function glassStyle(opts: { dark?: boolean; radius?: number; strong?: boolean } = {}): React.CSSProperties {
  const { dark = true, radius = 22, strong = false } = opts
  return {
    background: dark ? `rgba(255,255,255,${strong ? 0.14 : 0.09})` : `rgba(255,255,255,${strong ? 0.55 : 0.4})`,
    backdropFilter: 'blur(26px) saturate(180%)',
    WebkitBackdropFilter: 'blur(26px) saturate(180%)',
    borderRadius: radius,
    border: `0.5px solid rgba(255,255,255,${dark ? 0.18 : 0.6})`,
    boxShadow: [
      'inset 0 1px 1px rgba(255,255,255,0.45)',
      'inset 0 -1px 1px rgba(0,0,0,0.12)',
      '0 10px 30px rgba(0,0,0,0.35)',
    ].join(', '),
  }
}
