import type { Page } from '../App'

const workItems = [
  {
    id: 1,
    title: 'Myna · Healthcare AI Agent',
    outcome: 'Launched in 2 months. First deal: $100K over 3 years. 4 agents, 3 tools, 4 reports shipped.',
    tag: 'AI Agent',
    year: '2024',
    img: 'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=800&h=600&fit=crop&auto=format&q=80',
  },
  {
    id: 2,
    title: 'Canonic · Low-Code Platform',
    outcome: '10K+ users, 8K+ apps deployed. Onboarding up 210%. Conversion rate 5% → 20%.',
    tag: 'Platform',
    year: '2021',
    img: 'https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?w=800&h=600&fit=crop&auto=format&q=80',
  },
  {
    id: 3,
    title: 'Haptik · Bot Builder & Chat',
    outcome: '20% increase in first-message engagement. Scaled to millions of users across 50+ businesses.',
    tag: 'Conversational AI',
    year: '2019',
    img: 'https://images.unsplash.com/photo-1658953229625-aad99d7603b4?w=800&h=600&fit=crop&auto=format&q=80',
  },
]

const experienceStrip = [
  { label: 'Product Designer', years: '10+', unit: 'years' },
  { label: 'Design Facilitator', years: '7+', unit: 'years' },
  { label: 'Product Builder', years: '6+', unit: 'years' },
  { label: 'Working with AI', years: '5+', unit: 'years' },
]

const brands = [
  { name: 'Mercedes', tier: 1 },
  { name: 'Société Générale', tier: 1 },
  { name: 'Birdeye', tier: 1 },
  { name: 'Haptik', tier: 1 },
  { name: 'Paytm', tier: 1 },
  { name: 'Blue Yonder', tier: 2 },
  { name: 'Embibe', tier: 2 },
  { name: 'Ziffi', tier: 2 },
  { name: "Chef's Basket", tier: 2 },
]

interface HomeProps {
  navigate: (p: Page) => void
}

export default function Home({ navigate }: HomeProps) {
  return (
    <div className="bg-canvas">

      {/* ── 1. Hero ───────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col justify-end px-6 md:px-12 pt-28 pb-16 max-w-7xl mx-auto">
        <div className="max-w-5xl">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold mb-10">
            Lead Product Designer · AI-Native
          </p>
          <h1 className="font-display font-light text-[clamp(3rem,8vw,6.5rem)] leading-[0.92] tracking-tight text-ink mb-10">
            Product design,{' '}
            <em className="italic">built</em>
            <br />
            with AI.
          </h1>
          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16">
            <p className="text-dim text-base md:text-lg max-w-md leading-relaxed">
              10+ years of craft. I use Cursor and Claude Code to prototype
              end to end, not just hand off specs.
            </p>
            <p className="text-ink/40 text-sm max-w-xs leading-relaxed">
              The best solution can come from anywhere. My job is to get to it
              fast, then make it real.{' '}
              <button
                onClick={() => navigate('process')}
                className="text-gold hover:text-ink transition-colors underline underline-offset-4 decoration-gold/40"
              >
                See how I work →
              </button>
            </p>
          </div>
        </div>
        <div className="mt-16 flex items-center gap-3">
          <div className="w-8 h-px bg-ink/20" />
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dim">Scroll</span>
        </div>
      </section>

      {/* ── 2. Experience Strip ───────────────────────────────────── */}
      <section className="border-t border-b border-ink/8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {experienceStrip.map((item, i) => (
            <div
              key={i}
              className={`px-6 md:px-10 py-10 ${i > 0 ? 'border-l border-ink/8' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''}`}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <p className="font-display text-5xl md:text-6xl font-light text-ink leading-none">
                  {item.years}
                </p>
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold self-end pb-1">
                  {item.unit}
                </p>
              </div>
              <p className="text-dim text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Selected Work ──────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="font-display font-light text-2xl md:text-3xl text-ink">
            Selected Work
          </h2>
          <button
            onClick={() => navigate('work')}
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-dim hover:text-gold transition-colors"
          >
            All work →
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {workItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate('work')}
              className="group bg-panel border border-ink/8 overflow-hidden text-left hover:border-gold/25 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden bg-panel2">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold">
                    {item.tag}
                  </span>
                  <span className="font-mono text-[10px] text-dim">{item.year}</span>
                </div>
                <h3 className="font-display font-light text-xl text-ink mb-2 group-hover:text-gold transition-colors duration-200">
                  {item.title}
                </h3>
                <p className="text-dim text-sm leading-relaxed">{item.outcome}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('work')}
            className="font-mono text-[11px] tracking-[0.15em] uppercase text-dim border border-ink/15 px-6 py-3 hover:border-gold/40 hover:text-gold transition-all duration-200"
          >
            View all case studies
          </button>
        </div>
      </section>

      {/* ── 4. Client Brands ─────────────────────────────────────── */}
      <section className="border-t border-ink/8">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-10">
            Brands worked with
          </p>
          {/* Tier 1 — prominent */}
          <div className="flex flex-wrap gap-x-10 gap-y-4 mb-6">
            {brands.filter(b => b.tier === 1).map((brand) => (
              <span
                key={brand.name}
                className="font-display font-light text-2xl md:text-3xl text-ink/50 hover:text-ink/80 transition-colors duration-200"
              >
                {brand.name}
              </span>
            ))}
          </div>
          {/* Tier 2 — secondary */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {brands.filter(b => b.tier === 2).map((brand) => (
              <span
                key={brand.name}
                className="font-sans text-sm text-dim/50 hover:text-dim transition-colors duration-200"
              >
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Process Teaser ────────────────────────────────────── */}
      <section className="border-t border-ink/8">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
              How I work
            </p>
            <p className="font-display font-light text-2xl md:text-3xl text-ink leading-snug">
              Design is facilitation, not authorship.
              The best answer can come from anywhere;
              my job is to get to it fast, then make it real.
            </p>
          </div>
          <button
            onClick={() => navigate('process')}
            className="flex-shrink-0 font-mono text-[11px] tracking-[0.15em] uppercase text-gold border border-gold/30 px-7 py-4 hover:bg-gold/8 transition-colors"
          >
            See the process →
          </button>
        </div>
      </section>

    </div>
  )
}
