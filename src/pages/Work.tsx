import type { Page } from '../App'
import { featuredProjects } from '../content'

const caseStudies = featuredProjects()

interface WorkProps {
  navigate: (p: Page) => void
}

export default function Work({ navigate }: WorkProps) {
  return (
    <div className="bg-canvas pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold mb-5">
            Case Studies
          </p>
          <h1 className="font-display font-light text-5xl md:text-6xl text-ink leading-[0.95] mb-6">
            Work
          </h1>
          <p className="text-dim text-base leading-relaxed">
            Each card links out to the source: a repo, a live build, or the Figma file. These cards
            show the outcome, click through for the full story.
          </p>
        </div>

        {/* Case Study Grid */}
        <div className="space-y-4">
          {caseStudies.map((cs, i) => (
            <a
              key={cs.id}
              href={cs.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row border border-ink/8 bg-panel hover:border-gold/25 transition-all duration-300 overflow-hidden"
            >
              {/* Index number */}
              <div className="hidden md:flex items-center justify-center w-16 flex-shrink-0 border-r border-ink/8">
                <span className="font-mono text-[11px] text-dim/50">0{i + 1}</span>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between p-7 flex-1">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-gold">
                          {cs.medium}
                        </span>
                        <span className="font-mono text-[10px] text-dim/50">{cs.company}</span>
                      </div>
                      <h2 className="font-display font-light text-2xl md:text-3xl text-ink group-hover:text-gold transition-colors duration-200">
                        {cs.name}
                      </h2>
                    </div>
                    <span className="text-dim/40 text-xl mt-1 group-hover:text-gold transition-colors flex-shrink-0">
                      ↗
                    </span>
                  </div>
                  <p className="text-dim text-sm leading-relaxed max-w-xl mb-4">
                    {cs.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-ink/70 text-sm font-medium">{cs.outcome}</p>
                  <div className="flex gap-2 ml-4">
                    {cs.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[9px] tracking-wider uppercase text-dim/50 border border-ink/8 px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Process CTA */}
        <div className="mt-16 border-t border-ink/8 pt-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-dim mb-2">
              How I work
            </p>
            <p className="font-display font-light text-2xl text-ink">
              Want to understand the process behind these?
            </p>
          </div>
          <button
            onClick={() => navigate('process')}
            className="flex-shrink-0 font-mono text-[11px] tracking-[0.15em] uppercase text-gold border border-gold/30 px-6 py-3 hover:bg-gold/8 transition-colors"
          >
            See my process →
          </button>
        </div>
      </div>
    </div>
  )
}
