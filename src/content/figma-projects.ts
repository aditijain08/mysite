import type { FigmaProject } from './types'

// Design work built in Figma. All entries are featured on the Work page —
// `linkUrl` should point at the real published Figma file/frame.
export const figmaProjects: FigmaProject[] = [
  {
    id: 'haptik-bot-builder',
    name: 'Haptik · Bot Builder & Chat',
    company: 'Jio Haptik · Conversational AI · 2019–2020',
    tags: ['Conversational AI', 'Chat', 'Agent Builder'],
    description: "Redesigned the chat interface for Haptik's conversational AI platform using analytics and user research. Designed and iterated on the Bot Builder, Agent Chat, and Chat Interface, collaborating cross-functionally with product, engineering, and business. Led a proof of concept to automate IVR processes for Jio with multilingual support. Scaled the design team from 2 to 5.",
    outcome: '20% increase in first-message engagement. Scaled to millions of users across 50+ businesses.',
    color: '#9747FF',
    frames: ['Bot Builder', 'Agent Chat', 'Chat UI'],
    linkUrl: '#',
    linkLabel: 'Open in Figma',
    featured: true,
  },
  {
    id: 'mercedes-amg-app',
    name: 'Mercedes AMG App',
    company: 'Goodwork Labs · Automotive · 2018',
    tags: ['Automotive', 'Mobile', 'UI Design'],
    description: "Led the UI overhaul for the Mercedes AMG mobile app, a high-end automotive experience where craft and precision aren't optional. Redesigned the core experience with a dark, performance-oriented visual language that matched the brand's engineering ethos. Also designed the Michelin Tyres dashboard at Blue Yonder.",
    outcome: '24% increase in engagement. Significant rise in returning users.',
    color: '#28C840',
    frames: ['Home', 'Performance', 'Connect'],
    linkUrl: '#',
    linkLabel: 'Open in Figma',
    featured: true,
  },
]
