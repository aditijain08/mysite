import type { Page } from '../App'

const creativeItems = [
  {
    label: 'Painting',
    descriptor: 'Custom sneakers',
    img: '/photos/aditi-sneaker-greatwave.jpeg',
    alt: 'Hand-painted sneaker featuring Hokusai\'s The Great Wave off Kanagawa',
  },
  {
    label: 'Music',
    descriptor: 'Guitar & vocals',
    img: '/photos/aditi-guitar.jpeg',
    alt: 'Aditi playing acoustic guitar',
  },
  {
    label: 'Photography',
    descriptor: 'Street & portrait',
    img: '/photos/aditi-sunset.jpeg',
    alt: 'Sunset over the sea, shot by Aditi',
  },
]

interface AboutProps {
  navigate: (p: Page) => void
}

export default function About({ navigate }: AboutProps) {
  return (
    <div className="bg-canvas pt-24 pb-28">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="mb-10 grid md:grid-cols-2 gap-12 md:gap-20 items-end">
          <div>
            <img
              src="/photos/aditi-portrait.jpeg"
              alt="Aditi Jain Agrawal"
              className="w-28 h-28 rounded-full object-cover mb-5"
            />
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold mb-5">
              About
            </p>
            <h1 className="font-display font-light text-5xl md:text-6xl text-ink leading-[0.95]">
              Hi, I'm Aditi
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-ink/80 text-base leading-relaxed">
              I'm a Lead Product Designer focused on AI-native products, the kind where the design
              challenge isn't just visual, it's in the interaction model between a user and a
              system that's probabilistic, adaptive, and occasionally wrong in interesting ways.
            </p>
            <p className="text-ink/80 text-base leading-relaxed">
              My background is in facilitation as much as it is in design. I run Google-style
              Design Sprints to get teams unstuck on what to build next, and I treat figuring out
              which problem is worth solving as part of that facilitation, not a separate step
              before it. Create the conditions, don't author the answer. AI and code just gave
              that instinct a sharper edge.
            </p>
          </div>
        </div>

        {/* Experience metrics strip */}
        <section className="mb-14 border-t border-b border-ink/8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { years: '10+', label: 'Product Designer' },
              { years: '7+',  label: 'Design Facilitator' },
              { years: '6+',  label: 'Product Builder' },
              { years: '5+',  label: 'Working with AI' },
            ].map((item, i) => (
              <div key={i} className={`px-6 md:px-8 py-8 ${i > 0 ? 'border-l border-ink/8' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''}`}>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-display font-light text-4xl md:text-5xl text-ink leading-none">{item.years}</span>
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-gold self-end pb-0.5">yrs</span>
                </div>
                <p className="text-dim text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI since 2017 callout */}
        <div className="mb-14 flex items-start gap-4 border-l-2 border-gold/40 pl-5">
          <div>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold mb-1">AI & Big Data since 2017</p>
            <p className="text-ink/60 text-sm leading-relaxed max-w-2xl">
              Working with conversational AI, agent builders, and data-heavy platforms since Haptik in 2019, before it was a design trend. Canonic's low-code platform, Birdeye's AI listings, and Myna's healthcare agent are all continuations of the same thread.
            </p>
          </div>
        </div>

        {/* Client brands */}
        <section className="mb-14 pb-14 border-b border-ink/8">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-8">Brands worked with</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {['Mercedes', 'Société Générale', 'Birdeye', 'Haptik', 'Paytm', 'Blue Yonder', 'Embibe', 'Ziffi', "Chef's Basket"].map((b) => (
              <span key={b} className="font-display font-light text-xl md:text-2xl text-ink/45 hover:text-ink/70 transition-colors duration-200">{b}</span>
            ))}
          </div>
        </section>

        {/* Trajectory */}
        <section className="mb-20 pt-14">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                Where I started
              </p>
              <p className="text-ink/70 text-sm leading-relaxed">
                Early career in interaction design at consultancies like The Minimalist and
                Goodwork Labs, learned that design without a ship date is theory. Developed the
                habit of getting to testable fast, even when the tools were slow.
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                Building craft
              </p>
              <p className="text-ink/70 text-sm leading-relaxed">
                Spent years at Jio Haptik, a conversational AI platform scaling to millions of
                users across 50+ businesses, where scale forced rigor: systems thinking,
                cross-functional alignment, design that has to hold up in production, not just in
                a Figma prototype. Then cofounded Canonic, a low-code platform with 10K+ users,
                where leading design end-to-end meant owning both the craft and the tradeoffs.
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                Where I am now
              </p>
              <p className="text-ink/70 text-sm leading-relaxed">
                At Birdeye, leading design end-to-end across Listings and Myna, its healthcare AI
                agent, for 100K+ businesses. IC-focused, AI-native, building end-to-end with
                Cursor and Claude Code. Along the way I've set direction and mentored designers on
                small teams, experience that shapes how I think about scale, even though my focus
                now is hands-on craft.
              </p>
            </div>
          </div>
        </section>

        {/* Creative Practice */}
        <section className="mb-20 border-t border-ink/8 pt-14">
          <div className="mb-10">
            <h2 className="font-display font-light text-3xl text-ink mb-3">
              Outside the work
            </h2>
            <p className="text-dim text-base max-w-xl leading-relaxed">
              I paint custom sneakers, shoot street photography, and play guitar and sing. Not as
              metaphors for design thinking, just because making things across mediums is how I
              stay curious. The instinct for iteration and detail carries over whether or not I
              intend it to.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {creativeItems.map((item) => (
              <div key={item.label} className="group relative overflow-hidden bg-panel2">
                <div className="aspect-square">
                  <img
                    src={item.img}
                    alt={item.alt}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-canvas/80 to-transparent">
                  <p className="font-display font-light text-ink text-sm">{item.label}</p>
                  <p className="font-mono text-[10px] text-dim/80 tracking-wider">{item.descriptor}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values / one more thing */}
        <section className="mb-20 border border-ink/8 bg-panel p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                What I look for in a team
              </p>
              <ul className="space-y-3">
                {[
                  'People who think the design is the product, not the artifact.',
                  "Teams where 'shipped' means users changed their behavior.",
                  'Engineers who care about the why, not just the spec.',
                  'Orgs comfortable with a designer who raises PRs.',
                ].map((item, i) => (
                  <li key={i} className="text-ink/70 text-sm leading-relaxed pl-4 border-l border-ink/10">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
                What you get
              </p>
              <ul className="space-y-3">
                {[
                  'Research-grounded decisions, not taste disguised as strategy.',
                  'Working prototypes before alignment meetings, not after.',
                  'Someone who owns the outcome past the handoff.',
                  'Design and some code, not one or the other.',
                ].map((item, i) => (
                  <li key={i} className="text-ink/70 text-sm leading-relaxed pl-4 border-l border-ink/10">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-display font-light text-2xl md:text-3xl text-ink mb-1">
              Want to work together?
            </p>
            <p className="text-dim text-sm">
              Open to IC roles at AI-native companies. Available for conversations now.
            </p>
          </div>
          <button
            onClick={() => navigate('contact')}
            className="flex-shrink-0 font-mono text-[11px] tracking-[0.15em] uppercase text-gold border border-gold/30 px-6 py-3 hover:bg-gold/8 transition-colors"
          >
            Get in touch →
          </button>
        </div>
      </div>
    </div>
  )
}
