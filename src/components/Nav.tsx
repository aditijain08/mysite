import { useState, useEffect } from 'react'
import type { Page } from '../App'

interface NavProps {
  current: Page
  navigate: (p: Page) => void
}

export default function Nav({ current, navigate }: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links: { label: string; page: Page }[] = [
    { label: 'Work', page: 'work' },
    { label: 'Process', page: 'process' },
    { label: 'About', page: 'about' },
    { label: 'Resume', page: 'resume' },
    { label: 'Contact', page: 'contact' },
  ]

  const handleNav = (p: Page) => {
    navigate(p)
    setMenuOpen(false)
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-canvas/95 backdrop-blur-sm border-b border-ink/5' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <button
            onClick={() => handleNav('home')}
            className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50 hover:text-gold transition-colors duration-200"
          >
            Aditi
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {links.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => handleNav(page)}
                className={`text-sm transition-colors duration-200 ${
                  current === page ? 'text-ink' : 'text-dim hover:text-ink/80'
                }`}
              >
                {label}
              </button>
            ))}
            <a
              href="/resume.pdf"
              download="Aditi_Jain_Agrawal_Resume.pdf"
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold border border-gold/30 px-3 py-1.5 hover:bg-gold/8 transition-colors duration-200"
            >
              Download ↓
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-dim hover:text-ink transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1.5">
              <span className={`block w-5 h-px bg-current transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-px bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-px bg-current transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-canvas/98 flex flex-col justify-center px-8">
          <div className="flex flex-col gap-6">
            {[{ label: 'Home', page: 'home' as Page }, ...links].map(({ label, page }) => (
              <button
                key={page}
                onClick={() => handleNav(page)}
                className="text-left font-display text-4xl font-light text-ink hover:text-gold transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
