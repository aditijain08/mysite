import { useState } from 'react'
import type { Page } from '../App'
import { processNotes } from '../content'

const beliefs = processNotes

const beforeItems = [
  'Who is this for: real users in a real moment, not a persona of convenience.',
  "What problem matters: the job to be done, weighed against everything else it could have been.",
  'What behavior changes: the shift I expect to see, named before I build, not after.',
  "What I'm deliberately not building: scope cuts are design decisions, not compromises.",
]

const afterItems = [
  "Validation: real users, real tasks, evidence decides what actually ships.",
  "Edge cases and states: empty, loading, error, extreme; the happy path is the easy path.",
  "Systems thinking: how it fits the rest of the product, patterns, components, consistency.",
  "Content: words are the interface; placeholder copy isn't finished design.",
  "Failure and refinement: recovery paths, the polish pass, and what I'd change now it's live.",
]

interface ProcessProps {
  navigate: (p: Page) => void
}

export default function Process({ navigate }: ProcessProps) {
  const [openBelief, setOpenBelief] = useState<string | null>(null)

  return (
    <div className="bg-canvas pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="mb-20 max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold mb-5">
            Process & Philosophy
          </p>
          <h1 className="font-display font-light text-5xl md:text-6xl text-ink leading-[0.95] mb-6">
            How I work
          </h1>
          <p className="text-dim text-base leading-relaxed">
            Design as facilitation, accelerated by AI. The philosophy, the methods, and how they
            collapse into a working prototype instead of a story about one.
          </p>
        </div>

        {/* Half one — Belief */}
        <section className="mb-20 max-w-3xl">
          <h2 className="font-display font-light text-3xl text-ink mb-8">The belief</h2>
          <div className="space-y-6 text-base leading-relaxed">
            <p className="text-ink/80">
              Design isn't about being the sole author of the answer. It's about creating the
              conditions for the right answer to surface, from whoever's in the room, from
              whatever direction it comes.
            </p>
            <p className="text-ink/80">
              I learned this running Google-style Design Sprints: map the problem, diverge fast,
              converge on one bet, prototype it, test it, all in days, not months.
            </p>
            <p className="text-ink/80">
              What's changed is what a sprint can end in. It used to end in a paper prototype and
              a story you told about how it would work. Now it can end in something{' '}
              <em className="italic text-ink not-italic" style={{ fontStyle: 'italic' }}>real</em>, a
              working interface you can click, break, and ship.
            </p>
            <p className="text-dim text-sm border-l-2 border-gold/40 pl-5 ml-2">
              AI makes prototypes fast. Good design still takes time; the prototype is where
              thinking starts, not where it ends.
            </p>
          </div>
        </section>

        {/* Belief Nodes */}
        <section className="mb-24">
          <div className="flex items-baseline gap-6 mb-8">
            <h2 className="font-display font-light text-2xl text-ink">Points of view</h2>
            <span className="font-mono text-[10px] tracking-wider text-dim uppercase">
              Click to expand
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {beliefs.map((belief) => (
              <button
                key={belief.id}
                onClick={() => setOpenBelief(openBelief === belief.id ? null : belief.id)}
                className={`text-left border p-6 transition-all duration-300 ${
                  openBelief === belief.id
                    ? 'border-gold/40 bg-panel2'
                    : 'border-ink/8 bg-panel hover:border-ink/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-gold">
                    {belief.cluster}
                  </span>
                  <span
                    className={`text-dim text-sm transition-transform duration-200 ${
                      openBelief === belief.id ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </div>
                <p className="font-display font-light text-lg text-ink mb-1">{belief.title}</p>
                <p className="text-dim text-sm">{belief.preview}</p>
                {openBelief === belief.id && (
                  <p className="text-ink/70 text-sm leading-relaxed mt-4 pt-4 border-t border-ink/8">
                    {belief.content}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Before / After Checklist */}
        <section className="mb-24 border border-ink/8 bg-panel">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink/8">
            <div className="p-8 md:p-10">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-5">
                Before the prototype
              </p>
              <ul className="space-y-4">
                {beforeItems.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[10px] text-dim/50 mt-0.5 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-ink/70 text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 md:p-10">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-5">
                After the prototype ships
              </p>
              <ul className="space-y-4">
                {afterItems.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-[10px] text-dim/50 mt-0.5 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-ink/70 text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Half two — Proof of Build */}
        <section className="mb-20">
          <h2 className="font-display font-light text-3xl text-ink mb-10">The proof</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Build card */}
            <div className="border border-ink/8 bg-panel p-8">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold mb-6">
                Self-directed build
              </p>
              <h3 className="font-display font-light text-2xl text-ink mb-3">
                Sprint-to-Ship Prototype Tool
              </h3>
              <p className="text-dim text-sm leading-relaxed mb-6">
                Built a lightweight facilitation tool for running async design sprints with
                distributed teams. The first version went from idea to clickable in a weekend, the
                kind of compressed timeline the Process page describes, applied to itself.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Cursor', 'Claude Code', 'React', 'Vite'].map((tool) => (
                  <span
                    key={tool}
                    className="font-mono text-[9px] tracking-wider uppercase text-gold/70 border border-gold/20 px-2 py-1"
                  >
                    {tool}
                  </span>
                ))}
              </div>
              <a
                href="#"
                className="font-mono text-[10px] tracking-wider uppercase text-dim hover:text-gold transition-colors border-b border-dim/30 pb-0.5"
              >
                Live demo ↗
              </a>
            </div>

            {/* Working with engineering */}
            <div className="border border-ink/8 bg-panel p-8">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold mb-6">
                Working with engineering
              </p>
              <h3 className="font-display font-light text-2xl text-ink mb-4">
                How I actually work day to day
              </h3>
              <ul className="space-y-4">
                {[
                  'Raise PRs myself for smaller tickets (copy tweaks, spacing, state fixes) instead of only handing off specs.',
                  'Do design QA directly against staging builds, not just reviewing static Figma frames.',
                  "Give feedback in the same tools engineers use (GitHub comments, Linear) rather than only in Figma.",
                  "Prototype in code when a Figma frame can't answer the question. Especially for motion, states, and real data.",
                ].map((item, i) => (
                  <li key={i} className="text-ink/70 text-sm leading-relaxed pl-4 border-l border-ink/10">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Work CTA */}
        <div className="border-t border-ink/8 pt-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <p className="font-display font-light text-2xl text-ink max-w-sm">
            Want to see this process applied to a real problem?
          </p>
          <button
            onClick={() => navigate('work')}
            className="flex-shrink-0 font-mono text-[11px] tracking-[0.15em] uppercase text-gold border border-gold/30 px-6 py-3 hover:bg-gold/8 transition-colors"
          >
            View case studies →
          </button>
        </div>
      </div>
    </div>
  )
}
