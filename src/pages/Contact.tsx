export default function Contact() {
  return (
    <div className="bg-canvas min-h-screen pt-24 pb-28 flex items-center">
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gold mb-5">
            Contact
          </p>
          <h1 className="font-display font-light text-5xl md:text-7xl text-ink leading-[0.92] mb-10">
            Let's talk.
          </h1>
          <p className="text-dim text-base leading-relaxed mb-14 max-w-md">
            I'm open to IC roles at AI-native companies and always up for a good design
            conversation. Email is the fastest way to reach me, no contact form to navigate.
          </p>

          {/* Contact Links */}
          <div className="space-y-4 mb-16">
            <a
              href="mailto:aditi8394@gmail.com"
              className="group flex items-center justify-between border border-ink/8 bg-panel px-7 py-5 hover:border-gold/30 transition-all duration-200"
            >
              <div className="flex items-center gap-5">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dim w-20">
                  Email
                </span>
                <span className="text-ink/80 group-hover:text-gold transition-colors">
                  aditi8394@gmail.com
                </span>
              </div>
              <span className="text-dim group-hover:text-gold transition-colors">↗</span>
            </a>

            <a
              href="https://linkedin.com/in/aditi-jain-agrawal"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between border border-ink/8 bg-panel px-7 py-5 hover:border-gold/30 transition-all duration-200"
            >
              <div className="flex items-center gap-5">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dim w-20">
                  LinkedIn
                </span>
                <span className="text-ink/80 group-hover:text-gold transition-colors">
                  linkedin.com/in/aditi-jain-agrawal
                </span>
              </div>
              <span className="text-dim group-hover:text-gold transition-colors">↗</span>
            </a>

            <a
              href="/resume.pdf"
              download="Aditi_Jain_Agrawal_Resume.pdf"
              className="group flex items-center justify-between border border-gold/20 bg-panel px-7 py-5 hover:border-gold/50 hover:bg-gold/5 transition-all duration-200"
            >
              <div className="flex items-center gap-5">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dim w-20">
                  Resume
                </span>
                <span className="text-gold/80 group-hover:text-gold transition-colors">
                  Download PDF
                </span>
              </div>
              <span className="text-gold/50 group-hover:text-gold transition-colors">↓</span>
            </a>
          </div>

          {/* Fine print */}
          <p className="font-mono text-[10px] tracking-wider text-dim/40 uppercase">
            Based in New Delhi, India · Available for remote IC roles · Open to conversations now
          </p>
        </div>
      </div>
    </div>
  )
}
