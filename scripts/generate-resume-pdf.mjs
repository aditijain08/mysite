// Renders the one-page resume to public/resume.pdf for download. Layout and
// content density follow the reference one-pager: the current role (Birdeye)
// gets full bullets, older roles are compact single lines, and a right-hand
// sidebar carries Proof + skill categories — set in the site's own gold/ink/
// serif/mono palette rather than the reference's photo+serif style. Every
// section from the long-form website page is still represented, just denser.
// Bullets support **bold** markdown for inline emphasis.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '..', 'public', 'resume.pdf')

const header = {
  name: 'Aditi Jain Agrawal',
  title: 'AI Native Product Designer',
  tagline: 'Builder · Designer · Facilitator · Coder',
  location: 'New Delhi, India · Remote',
  email: 'aditi8394@gmail.com',
  phone: '+91 95456 07318',
  linkedin: 'linkedin.com/in/aditi-jain-agrawal',
  summary:
    'Lead product designer with **10+ years** of experience. I treat design as **facilitation as much as craft**: framing the problem, drawing insight from the whole team, and driving to the best solution wherever it originates. Then I **build and ship it in code**, so the work lands as working product, not mockups.',
}

// The current role — full bullet detail, mirrors Resume.tsx's Birdeye entry.
const featured = {
  period: 'Sep 2024 – Present',
  location: 'Remote',
  role: 'Lead Product Designer',
  company: 'Birdeye',
  highlights: [
    'Led the launch of **Myna**, Birdeye\'s healthcare AI agent, in **two months** with a team of three (me plus two designers): shipped 4 customer agents (Front Desk, Waitlist, Pre-Visit, and Tagging & Routing), 3 tools, 4 reports, 4 internal tools, and the conversation builder configuration.',
    'Drove Myna\'s first customer wins: a pediatric group at **$100K over three years**, first location live with more in the pipeline, and a multi-location clinic across **three locations**.',
    'Coded the **agent builder component library**: 50+ components, 3 templates, and more.',
    'Built a **Claude Skill** on top of it that ships an entire working agent from a single prompt, and generated **5 agents in under 30 minutes**.',
    'Adapted the existing agent builder to support conversation building in **two weeks**.',
    'Self-taught coding with AI: set up a local dev environment, hand off directly in code where possible to cut implementation effort and improve accuracy, and am building a **handoff tool** to streamline design to development.',
    'Own design end-to-end for the **Listings** product: led a navigation and information architecture redesign, keyword ranking and appearance reporting, and AI recommendations, then shipped **4+ agents** across Listings and Reviews (Review Response, Review Generation, Listing Optimization, Listing Verifier, and Duplicate Suppression).',
  ],
}

// Older roles — compact, single line each (role · company, dates), no bullets.
const compact = [
  { role: 'Cofounder & Lead Product Designer', company: 'Canonic', period: 'Oct 2020 – Present' },
  { role: 'Senior Product Designer', company: 'Jio Haptik', period: 'Jun 2019 – Sep 2020' },
  { role: 'Product Designer', company: 'Paytm', period: 'Mar 2019 – Jun 2019' },
]

const earlier = {
  label: '2016 – 2019',
  line: 'UX Consultant, Goodwork Labs · Interaction Designer, The Minimalist — UI overhauls for Mercedes AMG and Michelin Tyres; ecommerce design for Chef\'s Basket and Ziffi Privé.',
}

const buildWithAI = ['Claude', 'Claude Skills', 'Cursor', 'Figma Make', 'React', 'HTML / CSS']
const tools = ['Figma', 'Maze', 'Hotjar', 'Google Analytics', 'Mural', 'Chromatic', 'Storybook']

const proof = [
  { label: 'Employee of the Month', line: 'Q1 2025, for helping beat a competitor and ship major platform upgrades.' },
  { label: 'Startup funding', line: 'raised an early round from institutional and angel investors.' },
  { label: 'Product Hunt', line: 'ranked Top 5 Product of the Day, twice.' },
  { label: 'Breaking Uneven podcast', line: 'featured guest, on entrepreneurship.' },
]

const skillsSidebar = [
  { label: 'AI & Agent Design', items: ['Workflow agents', 'Conversational agents', 'Prompt design', 'Agent builders', 'Agentic outcomes & testing'] },
  { label: 'Design', items: ['UI & visual design', 'Interaction design', 'Web & mobile design', 'Wireframing', 'Rapid prototyping', 'UX writing', 'Conversation design'] },
  { label: 'Design Systems', items: ['Component libraries in code', 'Design tokens', 'Live URL handoff', 'Storybook'] },
  { label: 'Craft', items: ['Facilitation & workshop leadership', 'Product strategy', 'User research', 'Usability testing', 'Journey mapping', 'Information architecture'] },
]

const education = {
  degree: 'Communication Design',
  school: 'MIT Institute of Design',
  period: '2011 – 2016 · Pune',
}

const internships = ['Ogilvy', 'Yes Yes Why Not', 'Quirkbox', 'OMG Digital']

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// **bold** markdown -> <strong>, with the rest HTML-escaped.
const rich = (s) =>
  s
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? `<strong style="color:#221E17;font-weight:600;">${esc(part.slice(2, -2))}</strong>`
        : esc(part)
    )
    .join('')

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; }
  html { background: #FAF8F3; }
  body {
    margin: 0;
    padding: 0.5in 0.65in;
    font-family: 'Instrument Sans', system-ui, sans-serif;
    color: #221E17;
    background: #FAF8F3;
    font-size: 11px;
    line-height: 1.4;
  }
  .mono { font-family: 'DM Mono', 'Courier New', monospace; }
  .gold { color: #A8813F; }
  .dim { color: #7A7364; }

  header { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(34,30,23,0.12); }
  h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 300;
    font-optical-sizing: none;
    font-variation-settings: 'WONK' 0, 'opsz' 20;
    font-size: 32px;
    margin: 0 0 4px;
    line-height: 1;
  }
  .title { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 5px; }
  .tagline { font-size: 10.5px; color: #7A7364; margin: 0 0 8px; }
  .contact { display: flex; flex-wrap: wrap; gap: 3px 18px; font-size: 9.5px; color: rgba(34,30,23,0.55); margin-bottom: 8px; }
  .summary { font-size: 10.5px; line-height: 1.5; color: rgba(34,30,23,0.8); max-width: 100%; }

  .columns { display: grid; grid-template-columns: 1.7fr 1fr; gap: 30px; }

  .section-label { font-size: 9px; letter-spacing: 0.17em; text-transform: uppercase; margin: 0 0 9px; }

  /* Featured (current) role */
  .job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 8px; }
  .job-title { font-size: 13.5px; }
  .job-title .role { font-family: 'Fraunces', Georgia, serif; font-weight: 400; }
  .job-title .company { color: #A8813F; }
  .job-meta { font-size: 9px; white-space: nowrap; text-align: right; }
  ul.highlights { margin: 0 0 14px; padding: 0; list-style: none; }
  ul.highlights li {
    position: relative; font-size: 10px; line-height: 1.45; color: rgba(34,30,23,0.75);
    padding-left: 13px; margin-bottom: 6px;
  }
  ul.highlights li::before {
    content: ''; position: absolute; left: 2px; top: 0.55em; width: 3px; height: 3px;
    border-radius: 50%; background: rgba(168,129,63,0.7);
  }
  ul.highlights li:last-child { margin-bottom: 0; }

  /* Compact older roles */
  .compact-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 6px 0; border-top: 1px solid rgba(34,30,23,0.08); }
  .compact-row .job-title { font-size: 11.5px; }
  .compact-row .job-title .role { font-family: 'Instrument Sans', sans-serif; font-weight: 500; }
  .earlier-row { padding: 7px 0; border-top: 1px solid rgba(34,30,23,0.08); }
  .earlier-row .earlier-label { font-size: 9px; margin: 0 0 2px; }
  .earlier-row p.line { font-size: 9.5px; line-height: 1.45; color: rgba(34,30,23,0.65); margin: 0; }

  .tag-block { margin-top: 14px; }
  .tag-block .section-label { margin-bottom: 7px; }
  .tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { font-size: 9px; color: rgba(34,30,23,0.65); border: 1px solid rgba(34,30,23,0.14); background: rgba(34,30,23,0.03); padding: 2px 8px; border-radius: 3px; }

  /* Sidebar */
  .sidebar-section { margin-bottom: 16px; }
  .proof-item { margin-bottom: 9px; }
  .proof-item:last-child { margin-bottom: 0; }
  .proof-item .label { font-size: 10.5px; font-weight: 600; display: block; margin-bottom: 1px; }
  .proof-item .line { font-size: 9.5px; line-height: 1.45; color: rgba(34,30,23,0.65); margin: 0; }

  .skill-group { margin-bottom: 11px; padding-top: 9px; border-top: 1px solid rgba(34,30,23,0.08); }
  .skill-group:last-child { margin-bottom: 0; }
  .skill-group-label { font-size: 8.5px; letter-spacing: 0.09em; text-transform: uppercase; color: #7A7364; margin: 0 0 3px; }
  .skill-items { font-size: 9.5px; line-height: 1.45; color: rgba(34,30,23,0.68); margin: 0; }

  .sidebar-divider { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(34,30,23,0.08); }

  .edu-degree { font-family: 'Fraunces', Georgia, serif; font-size: 12.5px; margin: 0 0 1px; }
  .edu-school { font-size: 9.5px; color: #A8813F; margin: 0 0 2px; }
  .edu-period { font-size: 9px; color: rgba(34,30,23,0.5); margin: 0; }

  .footer-note { font-size: 8.25px; color: rgba(34,30,23,0.35); margin-top: 14px; }
</style>
</head>
<body>
  <header>
    <h1>${esc(header.name)}</h1>
    <p class="title mono gold">${esc(header.title)}</p>
    <p class="tagline">${esc(header.tagline)}</p>
    <div class="contact">
      <span>${esc(header.location)}</span>
      <span>${esc(header.email)}</span>
      <span>${esc(header.phone)}</span>
      <span>${esc(header.linkedin)}</span>
    </div>
    <p class="summary">${rich(header.summary)}</p>
  </header>

  <div class="columns">
    <div>
      <p class="section-label mono gold">Experience</p>

      <div class="job-head">
        <p class="job-title"><span class="role">${esc(featured.role)}</span> · <span class="company mono">${esc(featured.company)}</span></p>
        <p class="job-meta mono dim">${esc(featured.period)} · ${esc(featured.location)}</p>
      </div>
      <ul class="highlights">
        ${featured.highlights.map((h) => `<li>${rich(h)}</li>`).join('')}
      </ul>

      ${compact.map((job) => `
      <div class="compact-row">
        <p class="job-title"><span class="role">${esc(job.role)}</span> · <span class="company mono gold">${esc(job.company)}</span></p>
        <p class="job-meta mono dim">${esc(job.period)}</p>
      </div>`).join('')}

      <div class="earlier-row">
        <p class="earlier-label mono gold">${esc(earlier.label)}</p>
        <p class="line">${esc(earlier.line)}</p>
      </div>

      <div class="tag-block">
        <p class="section-label mono gold">Build with AI</p>
        <div class="tags">${buildWithAI.map((t) => `<span class="tag mono">${esc(t)}</span>`).join('')}</div>
      </div>
      <div class="tag-block">
        <p class="section-label mono gold">Tools</p>
        <div class="tags">${tools.map((t) => `<span class="tag mono">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>

    <div>
      <div class="sidebar-section">
        <p class="section-label mono gold">Proof</p>
        ${proof.map((p) => `
        <div class="proof-item">
          <span class="label">${esc(p.label)}</span>
          <p class="line">${esc(p.line)}</p>
        </div>`).join('')}
      </div>

      ${skillsSidebar.map((g) => `
      <div class="skill-group">
        <p class="skill-group-label mono">${esc(g.label)}</p>
        <p class="skill-items">${g.items.map(esc).join(' · ')}</p>
      </div>`).join('')}

      <div class="sidebar-section sidebar-divider">
        <p class="section-label mono gold">Education</p>
        <p class="edu-degree">${esc(education.degree)}</p>
        <p class="edu-school mono">${esc(education.school)}</p>
        <p class="edu-period mono">${esc(education.period)}</p>
      </div>

      <div class="sidebar-section sidebar-divider">
        <p class="section-label mono gold">Early Internships</p>
        <p class="skill-items">${internships.map(esc).join(' · ')}</p>
      </div>
    </div>
  </div>

  <p class="footer-note mono">Full project detail & case studies: ${esc(header.linkedin)} · aditijain.dev</p>
</body>
</html>`

mkdirSync(path.dirname(outPath), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 816, height: 1056 } })
await page.setContent(html, { waitUntil: 'networkidle' })
if (process.env.DEBUG_HEIGHT) {
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`body scrollHeight: ${h}px vs page height: ${11 * 96}px`)
}
await page.pdf({
  path: outPath,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' },
})
await browser.close()

console.log(`Wrote ${path.relative(process.cwd(), outPath)}`)
