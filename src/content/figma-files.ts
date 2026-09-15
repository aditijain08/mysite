export type FigmaFileKind = 'fig' | 'make' | 'deck' | 'pdf' | 'jam'

// Real Birdeye/Canonic/Haptik products — every file below belongs to
// exactly one. 'Inbox' is a real product but has no files documented yet;
// left out of PRODUCTS until there's something to show, otherwise its
// section renders empty and the scroll list looks like it dead-ends.
export type Product = 'Listings' | 'Reviews' | 'Inbox' | 'Canonic' | 'Haptik'

export const PRODUCTS: Product[] = ['Listings', 'Reviews', 'Canonic', 'Haptik']

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
  // For files with a full written case study: the exact problem statement
  // and any remaining case-study sections (role, key decisions, what it
  // unlocks), each verbatim from the source doc rather than paraphrased.
  problem?: string
  detail?: string[]
  // Overview metadata surfaced at the top of the case study, above Problem/
  // Solution/Outcome — not buried in `detail`. `duration` doubles as the
  // Timeline field.
  role?: string
  team?: string
  status?: string
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
  problem?: string
  detail?: string[]
  role?: string
  team?: string
  status?: string
  productUnconfirmed?: boolean
}

// Listings is ordered Agents → Features → Reports → Docs (per Aditi); the
// other products keep file order as gathered.
const NAMES: RawEntry[] = [
  // ── Listings: agents ──
  {
    name: 'Listing optimization agent', kind: 'fig', product: 'Listings',
    url: 'https://www.figma.com/design/8r93DnLQjpCpnykpibALU0/Optimization-agent-2.0',
    summary: "I designed the agent to close that gap on its own, running a full keyword to profile pipeline rather than asking a business to write anything from scratch: Keyword collection. The agent pulls in both the business's own keywords and its competitors' keywords for the same category and area. A final keyword list. Rather than acting on two separate keyword sets, it generates one combined, deduplicated list that reflects both what the business already targets and what competitors are ranking for. Field mapping. That list gets mapped against the actual fields on the business's profile, description, services, hours, and the rest, so each recommendation lands on the specific field it should update. A generated update. The agent writes the recommended change to the profile itself, not just a suggestion to consider, but the actual proposed content. Publish or review. Depending on how much a business trusts the agent, the update either publishes automatically or routes to a recommendations dashboard where someone reviews it first. That same pipeline is what the product later grew on: what started as a single configurable agent was rebuilt onto a full workflow model with task level prompt control per field, without changing the underlying shape businesses interact with.",
    problem: "Listings lets a business manage its business information across every location from a single product, which matters directly for SEO. But keeping that information right is a constant, unglamorous job: the description, hours, services, and photos on a profile all need to reflect what a business actually offers and how competitors are positioning themselves, across however many locations a business runs. Nobody has time to manually rewrite that content location by location, so profiles quietly go stale, and a stale profile ranks worse.",
    outcome: "Across the pilot accounts running it over a twelve month window, profile impressions grew between 14 and 37 percent and profile engagement, calls, direction requests, and site clicks, grew between 3 and roughly 97 percent, with the agent generating anywhere from around 140 to over 6,000 keyword based recommendations per account depending on how many locations and fields that account manages. One customer described the biggest value as control: the ability to tailor recommendations by region or specialty, exclude specific terms they didn't want used, and review everything before it went live, with hyper localized descriptions and scheduled reports that made the work visible to their own leadership.",
    duration: '2 weeks',
    role: 'Lead Product Designer (solo design)',
    team: '1 designer',
    status: 'Live',
    detail: [
      "I designed this solo, end to end, and shipped it in two weeks.",
      "Because the pipeline is keyword collection, mapping, and generation as one reusable shape, extending it doesn't mean building a new agent. The same architecture is what the roadmap beyond this leans on next: filling in empty fields automatically, turning recommended keywords into tracked rankings, publishing one accepted recommendation across multiple listing sources at once, and recommending business attributes and menu content the same way.",
    ],
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
    summary: "Every business saw its recommendations grouped by field, in that same fixed order, with each recommendation showing what would change and letting the business apply it to as many or as few locations as they chose, or reject it outright. For description recommendations, a business could edit the generated wording directly before applying it, rather than accepting the suggestion exactly as generated. Rejected recommendations could be flagged with a reason, giving the team a real feedback signal on where the backend's suggestions weren't landing.",
    problem: "Before any of Listings' agents existed, a backend process already ran quietly for every customer, generating recommendations to improve a business's profile. But generating a recommendation is only half the job. Someone still had to decide whether to trust it, and across however many locations a business runs, trust isn't uniform: a recommendation that's obviously right for one location might be wrong for another. The feature needed a review layer that gave businesses real control over what got applied and where, not just a list of suggestions to accept wholesale.",
    outcome: "Across all accounts through August 2026, 36,892 accounts had received at least one recommendation, and 4,623 of them, 12.4 percent, had taken an action on one. Direct accounts adopted at more than double the rate of reseller accounts, 21.6 percent versus 9.0 percent, and once someone did engage, more than half of all decisions across both groups were accepts rather than rejects. Looking at the 51,388 individual field level decisions behind that, acceptance varied a lot by field: Services recommendations were accepted 78 percent of the time and Special Hours 67 percent, while Business Description, the single biggest source of volume, sat at 58.5 percent and Photos lagged well behind at 22.8 percent, businesses were far more willing to accept a generated suggestion than to go find and upload a photo themselves.",
    duration: '2 weeks',
    role: 'Lead Product Designer (solo design)',
    team: '1 designer, 1 PM, 1 EM',
    status: 'Live',
    detail: [
      "I designed this solo, working alongside a PM and an EM, and shipped it in two weeks, working through how a photo recommendation should behave differently from a text one, what editing a recommendation before applying it should allow, and how to collect feedback on recommendations a business rejected.",
      "Recommendations were ranked by field, not by predicted impact. Rather than scoring each recommendation and surfacing whatever looked most valuable first, I ranked by field itself, in a fixed order: Services, Description, Photos, and on from there. A business always encountered the same kind of recommendation in the same order, which made the review experience predictable and easy to build a habit around, even before any agent existed to make the recommendations themselves smarter.",
      "Not every field could offer the same kind of recommendation. Text fields like the business description got a generated suggestion, ready to review and apply. Photos couldn't work that way: the backend had no image to propose, so a photo recommendation instead flagged that a photo needed to be uploaded, closing a gap rather than proposing content. Designing the review experience around what each field could actually deliver, rather than forcing every field into one generic recommendation card, is what made the photo and text experiences feel intentional instead of broken.",
      "Applying a recommendation needed to be a location level choice. A business running many locations couldn't be forced into an all or nothing apply. I designed the review flow so a business could manually select exactly how many locations a recommendation should apply to, and reject it everywhere else, rather than treating every location as identical.",
      "This was the foundation the Optimization Agent was later built on top of, the field based recommendation and review pattern, the location level apply logic, and the feedback signal all carried forward once an agent replaced the backend job generating the recommendations themselves. The field level data this feature surfaced, especially the gap between how well Services and Description performed against Photos, is also what's now driving the next round of work: closing that adoption gap with empty field recommendations, tracking suggested keywords as measurable rankings, publishing one accepted recommendation across multiple listing sources at once, and turning rejection feedback into how future recommendations get generated.",
    ],
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
    summary: "Rather than building six separate agents, I designed one base agent and three optional capability layers that stack on top of it: The base agent sends review requests to every checked in contact using a predefined template. Simple, immediate, \"solicit after every visit.\" Smart targeting adds timing intelligence, sending each request at that contact's optimal day and time instead of the moment they check in. A/B testing adds message variation, testing multiple template options against each other to find what actually converts. Multi profile distribution adds balance, spreading requests across a business's locations and providers so reviews accumulate evenly rather than concentrating on whichever profile happens to get solicited first. Layered together, these three capabilities produce six real agent configurations in the library, from the simple base case up to an agent doing smart targeting, A/B testing, and multi profile distribution all at once, without me having to design or maintain six separate agents.",
    problem: "Getting a business more reviews sounds like one problem, but the same blanket approach, send every checked in contact the same template at the same time, leaves a lot on the table. Some businesses need reviews fast and don't care how they get them. Others want reviews spread evenly across locations and providers rather than piling up on one profile. Others are optimizing for conversion and want to know which message actually works. A single, rigid agent can't serve all of that.",
    outcome: "This is still an early rollout: 4 accounts running it so far, generating 2,227 reviews received and reaching 33,713 contacts, with roughly a 6.6 percent average click through rate on solicitations sent.",
    duration: '2 weeks',
    role: 'Lead Product Designer (solo design)',
    team: '1 designer',
    status: 'Live',
    detail: [
      "I designed this solo, end to end, and shipped it in two weeks.",
      "Because the capabilities are layered rather than hardcoded per agent, adding a seventh way to ask for a review means designing one new capability, not one new agent. The same pattern is what let this ship solo in two weeks instead of needing a team to build six standalone flows.",
    ],
  },
  {
    name: 'Review Response agent 2.0', kind: 'fig', product: 'Reviews',
    url: 'https://www.figma.com/design/13MutRb5rsVZ8qBRfp0ZAn/Review-Response-agent-2.0',
    summary: "Instead of picking one autonomy level and forcing every business into it, I designed the library as a spectrum businesses could choose along: No AI at all. Ready made templates reply automatically, with no AI writing involved. AI drafts, human edits. The agent reads how the reviewer feels, writes a reply, and shows it in the dashboard for a one click post, giving the business the final word on wording. AI drafts, human approves. Same AI authored reply, but routed for explicit approval before it ever posts. Fully autonomous. The agent reads sentiment, writes the reply, and posts it without a human in the loop at all. A hybrid balance. Reviews with no written text get an automatic reply, while reviews with actual text generate a one click suggestion instead, so the AI handles the easy cases and leaves judgment calls to a person. A complete workflow. Beyond just replying, this variant also creates a ticket, tags the review, and updates the relevant lists and segments automatically, turning a single review into a fully handled customer touchpoint. The point wasn't to convince businesses to trust AI fully. It was to meet them wherever their actual trust level was, and let that grow over time instead of forcing an all or nothing decision on day one.",
    problem: "Responding to reviews is public and reputational in a way most AI assisted tasks aren't. A wrong or tone deaf reply doesn't just fail quietly, it's visible on the business's profile for anyone to see. That meant businesses didn't want one fixed level of AI involvement, some wanted zero risk and full control, others wanted the AI to just handle it, and most wanted something in between depending on how much they trusted it yet.",
    outcome: "In the last 90 days alone, this agent generated 91,933 responses and posted 63,393 of them across 72 actively running accounts out of 165 tracked, saving an estimated 10,565 hours of manual reply work.",
    duration: '2 weeks',
    role: 'Lead Product Designer (solo design)',
    team: '1 designer',
    status: 'Live',
    detail: [
      "I designed this solo, end to end, and shipped it in two weeks.",
      "Because autonomy is a setting rather than a fixed product decision, a business can start with templates only and move toward full autonomy as trust builds, without ever needing a new agent or a migration. The product grows with how comfortable the business actually is, not with how comfortable we assumed they'd be.",
    ],
  },

  // ── Canonic ──
  {
    name: 'Canonic Core Style Guide', kind: 'fig', product: 'Canonic',
    summary: "To address these challenges, I spearheaded the development of a comprehensive design system tailored to Canonic's low-code frontend builder experience. This involved establishing standardised style guide, along with each component's interaction, possible configurations and adaptability. This served as the definitive reference point for design and development efforts, streamlining maintenance and scalability.",
    problem: "The existing component library faces significant challenges: it harbors inconsistencies in states, colors, configurations, and adaptability, hindering seamless user experiences. Moreover, the absence of a unified style guide complicates maintenance and scalability, exacerbating these issues.",
    outcome: "Reduced number of bugs, code optimization. Better looking pages, better looking final UI screens. Easier configuration, better configuration overrides.",
    duration: '3 months',
    role: 'Lead Product Designer, Project Manager',
    team: '1 sr. design consultant, 1 dev, 1 PM',
    detail: [
      "Company: Canonic's low-code frontend builder revolutionizes interface creation by enabling users to effortlessly drag and drop components, tailoring them to their project's requirements without any coding.",
      "Design Audit: Following a thorough design system audit, we identified key areas for enhancement in Canonic's low-code frontend builder. Inconsistencies were noted in spacing, states, strokes, colors, and curvature across components. To address this, we're standardizing these elements while introducing refinements for improved coherence. All components will adhere to a basic style guide and atomic design philosophy, thus establishing a robust foundation for interface creation. Additionally, we standardized variants and types, introducing primary, secondary, and tertiary designations for streamlined usage. These efforts aim to enhance user experience and streamline frontend development.",
      "Properties: For each component we defined the variants, states, size, configuration possibilities. Full list is on Notion.",
      "Style Guide: Designed to standardise colours, typography, and spacing. This guide ensures consistency and coherence across all components, enhancing the visual harmony of your projects.",
      "Components & Interactions: Our components are designed following the atomic design philosophy, ensuring a modular & scalable approach. Each element, from basic atoms to complex organisms, is meticulously crafted in Figma to include all states, variants, properties, and configurations. This methodology guarantees consistency, flexibility, and responsiveness across all devices.",
      "Branding Configuration: Easily customize the style guide from the Branding Settings section. Modify fonts, sizes, colors, and spacing values to align with your project's unique requirements, ensuring a tailored and cohesive design effortlessly.",
    ],
  },
  {
    name: 'Canonic Billing & Payments', kind: 'fig', product: 'Canonic',
    summary: "User's Billing Dashboard: Features such as plan overview, plan comparison, FAQ's, usage summary, modify plan, add payment methods, it became easy for user to take action. Checkout Flow: The checkout flow, integrated with Stripe, offers a seamless payment experience with multiple payment method options. Users can easily apply coupons and discount codes to avail themselves of special offers. This streamlined process ensures a quick and efficient checkout for enhanced customer satisfaction. Invoice Management Dashboard: Centralises all your invoices, providing an organised list for easy access. Users can view detailed information and statuses of each invoice. Additionally, it enables hassle-free downloading of invoices directly from the platform. Website: The website features a meticulously designed pricing page that clearly outlines various plans and their benefits. This ensures users can easily compare options and select the best fit for their needs.",
    problem: "Canonic was launched as a free-to-use platform. After getting validation, Canonic wanted to offer more to the users with freemium subscription plans. There was a need to define the pricing strategy for the paid plans along with a holistic experience for users to select/modify/cancel plans in a self-serve manner with complete customer support.",
    outcome: "Entire experience around billing and payments for the user.",
    duration: '1 month',
    role: 'Lead Product Designer',
    team: '1 PM, 2 devs',
    detail: [
      "Company: Founded in 2021, Canonic revolutionizes complex app development with its full-stack platform. With over 10,000 users globally, Canonic offers end-to-end app creation without code. It seamlessly connects to databases and services like Mongo, Postgres, Slack, and Shopify. Users can build multi-step workflows and interactive UIs using drag-and-drop components and JavaScript. Canonic stands out by providing unlimited user access across plans and enabling vendor lock-in-free exports of projects into human-readable code. It's a user-friendly solution for building scalable apps and automation efficiently.",
      "User research: Conducted user interviews to gather user needs, challenges and emotions, leading to the following user needs: Free trial period for exploring the platform will allow them to test thoroughly. Flexible plans with monthly and annual options to be able to scale easily. Easy plan cancellation process to not feel locked in. Usage monitoring to track limits, and not get stuck in critical situations. Option to enhance plans with additional features to use the platform in a cost effective manner. Multiple payment modes for seamless transactions experience. Access to monthly payment invoices for financial records. Support for international transactions to accept global payments.",
      "Stakeholder research: To drive revenue growth and enhance user satisfaction, offering a seamless billing and payment experience is crucial. I conducted stakeholder interviews with product managers, sales representatives, and customer support staff. These interviews provided valuable insights into their pain points and requirements, informing our design strategy. Sales Team Needs: provide data on users attempting to purchase or upgrade plans for targeted follow-ups; alert sales to users nearing or hitting usage limits for proactive engagement; identify users in specific segments for tailored sales pitches. Marketing Team Needs: identify popular plans to prioritize marketing efforts; segment paid users for targeted campaigns to drive engagement and upsell opportunities. Support Team Needs: alert about payment failures for proactive assistance and churn prevention; provide insights on user challenges with features for timely assistance and improved retention. Product Team Needs: gain insights into user behavior to optimize the user journey and encourage conversions; identify optimal moments to present upgrade options based on user usage patterns; analyze feature usage by paid users to prioritize development; continuously enhance the user experience to improve conversion and upselling opportunities.",
      "Service Blueprint: A visual representation of the service delivery process. \"I used it to understand the user journey, identify improvement opportunities, and facilitate cross-team collaboration in enhancing the user experience.\"",
    ],
  },

  // ── Haptik ──
  {
    name: 'Support Chatbot Usability', kind: 'fig', product: 'Haptik',
    summary: "The solution included a user-friendly chat interface with improved conversational experience. Along with this a unified chat design system for consistency.",
    problem: "Research revealed issues with chatbot discovery and engagement. Improving these would increase user conversations and queries resolved (task completion). If the chatbot fails to assist users effectively, core metrics like queries resolved (task completion) and CSAT suffer, negatively impacting the business.",
    outcome: "36% increase in conversations. 15% longer session durations. 15% higher number of query resolution (task completion).",
    duration: '6 months',
    role: 'Aditi Jain (Lead Designer)',
    team: '1 design manager, 1 PM, 3 engineers, 2 EMs, 1 QA',
    detail: [
      "Company: Jio Haptik, founded in 2013 and acquired by Reliance Jio in 2019, is a leading conversational AI platform that enhances customer engagement with advanced chatbots and virtual assistants. It offers scalable, customizable solutions for e-commerce, banking, healthcare, and telecom industries. Haptik offers three products: Chatbot (Web & Mobile), Chatbot Builder, and Agent Chat. The chatbot, embedded on client websites or apps, helps users resolve queries.",
      "User research: We conducted Moderated Usability Testing, focusing on discoverability and engagement in chat. Testing involved 5 users each from two different clients (Tata Insurance, Sleepy Cat), with sessions moderated by myself and my project manager. Recruitment was aided by clients and personal contacts. Task design included two queries and their flows. Insights revealed: users faced challenge in discovering the chatbot; accessing query that bot can answer was difficult; functionality issues were observed with the input box; language settings faced challenges, especially on mobile devices.",
      "Customer research: We utilized User Interviews to gather qualitative, generative insights. We created a questionnaire to delve into each phase of the user journey and improve the experience accordingly. Insights were gathered from discussions and responses. Findings revealed: bot prompts occupy excessive screen space, leading to customer hesitance; customization options for the top bar are limited; white labeling choices are restricted; user approval is required for data sharing.",
      "Stakeholder research: We opted for a Focus Group method to accommodate multiple stakeholders like founders, marketing, and sales teams, consolidating their needs onto one board. Insights revealed: the UI is outdated and needs updating; \"Powered by Haptik\" needs replacement to optimize space; there's a demand for a design system for internal feature development and business mockups; a feature to gather user feedback on query resolution is necessary; users need the ability to calculate total queries resolved as a Key Performance Indicator (KPI); for easy scalability, it was important to integrate the mobile responsive site inside client applications instead of native integration.",
      "Principles: Design for Transparency — present options upfront for easy user engagement. Design for Customizability — offer options for brand-aligned customization. Design for Scale — enable seamless integration in website/apps across devices.",
    ],
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
  problem: n.problem,
  detail: n.detail,
  role: n.role,
  team: n.team,
  status: n.status,
  productUnconfirmed: n.productUnconfirmed,
}))

export const FILE_KIND_LABEL: Record<FigmaFileKind, string> = {
  fig: 'Design file',
  make: 'Figma Make',
  deck: 'Slides',
  pdf: 'PDF',
  jam: 'FigJam',
}
