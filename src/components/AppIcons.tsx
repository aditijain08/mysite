// Shared app-icon glyphs — used by both the desktop shell (App.tsx) and the
// mobile iOS-style shell (MobileShell.tsx) so icon art isn't duplicated.

export function IconCursor({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#0F0F0F"/>
      <path d="M13 10 L13 31.5 L18.5 26 L22.5 34.5 L25.8 33 L21.8 24.8 L29.5 24.8 Z" fill="white" fillOpacity="0.92"/>
    </svg>
  )
}

// Bare sunburst mark with no background — used as the chat-message avatar in
// the Claude app recreation, where IconClaude's squircle app-icon shape would
// look wrong sitting directly on a message list.
export function ClaudeMark({ size = 14, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] as number[]).map((deg, i) => {
        const r = (deg * Math.PI) / 180
        return (
          <line
            key={i}
            x1={12 + Math.cos(r) * 3}
            y1={12 + Math.sin(r) * 3}
            x2={12 + Math.cos(r) * 10}
            y2={12 + Math.sin(r) * 10}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

export function IconFigma({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#1E1E1E"/>
      <rect x="12.5" y="7.5" width="9.5" height="9.5" rx="4.75" fill="#F24E1E"/>
      <rect x="22" y="7.5" width="9.5" height="9.5" rx="4.75" fill="#FF7262"/>
      <rect x="12.5" y="17" width="9.5" height="9.5" rx="4.75" fill="#A259FF"/>
      <circle cx="26.75" cy="21.75" r="4.75" fill="#1ABCFE"/>
      <rect x="12.5" y="26.5" width="9.5" height="9.5" rx="4.75" fill="#0ACF83"/>
    </svg>
  )
}

export function IconNotes({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#FFE234"/>
      <rect x="9" y="9" width="26" height="28" rx="2" fill="#FFFDF0"/>
      <rect x="9" y="9" width="26" height="6" rx="2" fill="#FFC200"/>
      <rect x="13" y="20" width="18" height="1.5" rx="0.75" fill="rgba(180,155,60,0.4)"/>
      <rect x="13" y="23.5" width="18" height="1.5" rx="0.75" fill="rgba(180,155,60,0.4)"/>
      <rect x="13" y="27" width="13" height="1.5" rx="0.75" fill="rgba(180,155,60,0.4)"/>
      <rect x="13" y="30.5" width="15" height="1.5" rx="0.75" fill="rgba(180,155,60,0.4)"/>
    </svg>
  )
}

export function IconAditi({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#0C0B09"/>
      <text x="22" y="28" textAnchor="middle" fill="#C9A86C" fontSize="15" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="300">AJ</text>
      <rect x="10" y="32" width="24" height="0.75" rx="0.4" fill="rgba(201,168,108,0.25)"/>
    </svg>
  )
}

export function IconClaude({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#CC785C"/>
      <g transform="translate(22, 22)">
        {([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] as number[]).map((deg, i) => {
          const r = (deg * Math.PI) / 180
          return (
            <line
              key={i}
              x1={Math.cos(r) * 4.5}
              y1={Math.sin(r) * 4.5}
              x2={Math.cos(r) * 11}
              y2={Math.sin(r) * 11}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )
        })}
      </g>
    </svg>
  )
}

export function IconMail({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#3478F6"/>
      <rect x="7" y="13" width="30" height="20" rx="2.5" fill="white"/>
      <path d="M7 15.5 L22 24.5 L37 15.5" stroke="#3478F6" strokeWidth="2.5" fill="none"/>
    </svg>
  )
}

export function IconPDF({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#F5F5F7"/>
      <path d="M10 7 H27 L36 16 V39 H10 Z" fill="white"/>
      <path d="M10 7 H27 L36 16 V39 H10 Z" stroke="#D0D0D5" strokeWidth="0.75"/>
      <path d="M27 7 L27 16 L36 16" fill="none" stroke="#D0D0D5" strokeWidth="0.75"/>
      <path d="M27 7 L36 16 L27 16 Z" fill="#E5E5EA"/>
      <rect x="10" y="28" width="26" height="9" rx="1.5" fill="#E53935"/>
      <text x="23" y="35" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="-apple-system, Arial, sans-serif" fontWeight="700" letterSpacing="0.05em">PDF</text>
      <rect x="14" y="19" width="16" height="1.2" rx="0.6" fill="#AEAEB5"/>
      <rect x="14" y="22" width="20" height="1.2" rx="0.6" fill="#AEAEB5"/>
      <rect x="14" y="25" width="11" height="1.2" rx="0.6" fill="#AEAEB5"/>
    </svg>
  )
}

export function IconPhotos({ size = 44 }: { size?: number }) {
  const petals = [
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
    '#00C7BE', '#007AFF', '#5856D6', '#FF2D55',
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="white"/>
      <g transform="translate(22,22)">
        {petals.map((color, i) => (
          <ellipse key={i} cx={0} cy={-8} rx={4.2} ry={7.5} fill={color} fillOpacity={0.88} transform={`rotate(${i * 45})`}/>
        ))}
        <circle cx={0} cy={0} r={4} fill="white"/>
      </g>
    </svg>
  )
}
