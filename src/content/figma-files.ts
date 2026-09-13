export type FigmaFileKind = 'fig' | 'make' | 'deck' | 'pdf' | 'jam'

// Real Birdeye/Canonic products — every file below belongs to exactly one.
// 'Inbox' is a real product but has no files documented yet; left out of
// PRODUCTS until there's something to show, otherwise its section renders
// empty and the scroll list looks like it dead-ends after Reviews.
export type Product = 'Listings' | 'Reviews' | 'Inbox' | 'Canonic'

export const PRODUCTS: Product[] = ['Listings', 'Reviews', 'Canonic']

export interface FigmaFileEntry {
  id: string
  name: string
  kind: FigmaFileKind
  product: Product
  color: string
  // Real Figma file URL. When present, the thumbnail opens it in a new tab;
  // when absent (a handful of files whose links weren't gathered) it falls
  // back to the shared team folder link.
  url?: string
  // A real screenshot of the file's own cover, pulled via the Figma MCP and
  // saved under public/figma-covers/. Falls back to a generated gradient
  // swatch when absent.
  coverImage?: string
  // Pulled from each file's own cover text via the Figma MCP — real project
  // copy, not invented. Outcome/duration aren't in the files themselves, so
  // those stay undocumented unless written up separately.
  summary?: string
  outcome?: string
  duration?: string
  // True for the handful of files whose product assignment is a guess (no
  // linked file to confirm against) — worth double-checking.
  productUnconfirmed?: boolean
}

// The real Birdeye Backup team folder these files live in — fallback link
// for files without their own URL yet.
const BIRDEYE_FOLDER_URL = 'https://www.figma.com/files/team/1679846896529543826/folder/652576946'

const PALETTE = ['#9747FF', '#5FB0C9', '#E8A23D', '#C9A86C', '#4FD1C5', '#F472B6', '#60A5FA', '#34D399']

interface RawEntry {
  name: string
  kind: FigmaFileKind
  product: Product
  url?: string
  coverImage?: string
  summary?: string
  outcome?: string
  duration?: string
  productUnconfirmed?: boolean
}

// Listings is ordered Agents → Features → Reports → Docs (per Aditi); the
// other products keep file order as gathered.
const NAMES: RawEntry[] = [
  // ── Listings: agents ──
  {
    name: 'Optimization agent 2.0', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/8r93DnLQjpCpnykpibALU0/Optimization-agent-2.0',
    summary: 'Listing optimization agent, v2.0.',
  },
  {
    name: 'Duplicate suppression agent', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/Bn7ZDNHuMkqZYaWaAma3rD/Duplicate-suppression-agent',
    summary: 'Listing duplicate suppression agent.',
  },
  {
    name: 'Verifier agent', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/tHr1JOGfn0FODOKvfWpyFj/Verifier-agent',
    coverImage: '/figma-covers/verifier-agent.png',
    summary: 'Listing verifier agent.',
  },
  // ── Listings: features ──
  {
    name: 'AI recommendations', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/VlwVjLfUUiwjzn0xAACozl/AI-recommendations',
    summary: 'Listings AI Recommendations — uses Google Keyword Planner & SEMrush to suggest keywords that improve a listing.',
  },
  {
    name: 'Bulk add keywords (Local SEO)', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/Ts479vM34sMm0httqkbafZ/Bulk-add-keywords--Local-SEO-',
    summary: 'Bulk add keywords for a business, for the local SEO report.',
  },
  {
    name: 'Category selection', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/ZmiwrtLSjftwVhInIbSXL7/Category-selection',
    summary: 'Category selection as part of business information.',
  },
  {
    name: 'Citations & URL Management', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/pJjuJn14m3qRAR5t2kmKAY/Citations---URL-Management',
    summary: 'Manage which citations to track for a business, and their respective listing URL.',
  },
  {
    name: 'Hotel Attributes', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/jEE3kFo9fok4ux5OUaJbjF/Hotel-Attributes',
    summary: 'Hotel attributes config (SOW-Wyndham) — configure attributes on the business info page.',
  },
  {
    name: 'Listings UX revamp', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/aZhC0UUtt0XT2AxqNmzoy8/Listings-UX-revamp',
    summary: 'Simplify the information architecture and interactions across Listings.',
  },
  {
    name: 'Product entities', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/qrbX5NrUSXt3Bzd5o4ai8T/Product-entities',
    summary: 'Create and manage a comprehensive list of products, usable across channels like Google Business Profile, website location pages, social media, and Google Merchant Center.',
  },
  {
    name: 'Schedule updates', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/K8XPblW9dWiiUL6yqd1OOO/Schedule-updates',
    summary: 'Create workflows to automatically update listing fields on a schedule.',
  },
  // ── Listings: reports ──
  {
    name: 'Keyword & citation tool', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/wiLwpcHRx3aocnbwtawkFt/Keyword---citation-tool',
    summary: 'Keyword & citation insights tool — compares business information detail across 3 AI platforms.',
  },
  {
    name: 'Listings ranking & appearance reports', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/jiwRi8mV7Z1fNXdjT5PylW/Listings-ranking---appearance-reports',
    summary: 'Ranking and appearance reports — shows reports around keyword ranking by location.',
  },
  {
    name: 'Yelp Reporting', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/bygfvgelCuTMFu3gF2LpkD/Yelp-Reporting',
    coverImage: '/figma-covers/yelp-reporting.png',
    summary: 'Reports for Yelp, matching the existing Google/Apple/Facebook/Bing listing reports.',
  },
  // ── Reviews ──
  {
    name: 'Review Generation Agent - 2.0', kind: 'fig', product: 'Reviews',
    url: 'https://www.figma.com/design/NwuNThn42ZaQPIwqulU3h1/Review-Generation-Agent---2.0',
  },
  {
    name: 'Review Response agent 2.0', kind: 'fig', product: 'Reviews',
    url: 'https://www.figma.com/design/13MutRb5rsVZ8qBRfp0ZAn/Review-Response-agent-2.0',
  },

  // ── Canonic ──
  {
    name: 'Canonic Core Style Guide', kind: 'fig', product: 'Canonic',
    summary: "Design system for Canonic's low-code frontend builder component library — a standardized style guide plus every component's states, variants, and configuration options.",
    outcome: 'Reduced number of bugs, better-looking final UI screens, and easier configuration and overrides.',
    duration: '3 months',
  },
  {
    name: 'Canonic Billing & Payments', kind: 'fig', product: 'Canonic',
    summary: "End-to-end billing and payments experience for Canonic's freemium plans — billing dashboard, Stripe checkout, invoice management, and pricing page — built from user, stakeholder, sales, and support research.",
    outcome: 'A self-serve billing flow letting users select, modify, and cancel plans with full support, built to drive revenue growth and user satisfaction.',
    duration: '1 month',
  },
]

export const figmaFiles: FigmaFileEntry[] = NAMES.map((n, i) => ({
  id: n.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name: n.name,
  kind: n.kind,
  product: n.product,
  color: PALETTE[i % PALETTE.length],
  url: n.url ?? BIRDEYE_FOLDER_URL,
  coverImage: n.coverImage,
  summary: n.summary,
  outcome: n.outcome,
  duration: n.duration,
  productUnconfirmed: n.productUnconfirmed,
}))

export const FILE_KIND_LABEL: Record<FigmaFileKind, string> = {
  fig: 'Design file',
  make: 'Figma Make',
  deck: 'Slides',
  pdf: 'PDF',
  jam: 'FigJam',
}
