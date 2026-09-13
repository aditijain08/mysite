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
  {
    id: 'haptik-chatbot-usability',
    name: 'Haptik · Support Chatbot Usability',
    company: 'Jio Haptik · Conversational AI',
    tags: ['Conversational AI', 'Chatbot', 'Usability'],
    description: "Improved the discovery, engagement, and usability of Haptik's support chatbot, embedded on client websites and apps to resolve user queries. Ran moderated usability testing, user interviews, and stakeholder focus groups (founders, marketing, sales) to surface discovery and engagement gaps hurting task completion and CSAT. Delivered a more user-friendly chat interface and a unified chat design system for consistency. Lead Designer · 6 months · with Asis Panda (Design Manager), Nikunj Sharma (PM), 3 engineers, 2 engineering managers, 1 QA.",
    outcome: '36% increase in conversations, 15% longer session durations, 15% higher query resolution (task completion).',
    color: '#5FB0C9',
    frames: ['Old Design', 'New Design'],
    linkUrl: '#',
    linkLabel: 'Open in Figma',
    featured: true,
  },
]
