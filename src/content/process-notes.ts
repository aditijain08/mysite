import type { ProcessNote } from './types'

// Process & philosophy notes — native content, not a link-out. Shared by the
// Home desktop Notes window and the Process page's belief-node grid.
export const processNotes: ProcessNote[] = [
  {
    id: 'design-is-facilitation',
    title: 'Design is facilitation',
    preview: 'The best solution can come from anywhere.',
    content: "I learned this running Google-style Design Sprints: map the problem, diverge fast, converge on one bet, prototype it, test it, all inside a week. The part that stuck wasn't the format, it was watching the best idea in the room come from someone other than me. Facilitation means I don't get to fall in love with my own answer before the room has had a chance to beat it. When I led Myna, Birdeye's healthcare AI agent, with a team of three, that instinct is why we shipped four customer agents in two months instead of arguing over one for six. My job isn't to be the smartest person about the solution. It's to make sure the room gets there fast, together, and that whoever's idea wins, wins because it's right.",
    cluster: 'Philosophy',
  },
  {
    id: 'not-a-feature-machine',
    title: "We're not feature machines",
    preview: "Deciding what's worth building is part of the job.",
    content: "Designers who only ship what's asked are half the equation. At Birdeye, simplifying the Listings information architecture meant fewer pages, not more, and the honest version of that work was telling stakeholders that a chunk of what we'd built over the years didn't need to exist as separate screens anymore. That's an uncomfortable conversation to start, because it usually means someone's earlier decision, sometimes my own, gets undone. But deciding what's worth building, and what's worth un-building, is design work, not a hand-off to a PM's backlog. I'd rather be the person asking whether a feature should exist at all than the person who ships it well and watches it sit unused.",
    cluster: 'Philosophy',
  },
  {
    id: 'creativity-isnt-just-visual',
    title: "Creativity isn't just visual",
    preview: 'The pixels are the smallest part of it.',
    content: "The most creative work I've done rarely shows up as a screen. It's in the solution chosen, the system designed underneath the interface, the reframe that turns what looked like a six-month build into something shipped in two weeks because the actual problem was smaller than the one we were handed. Coding Birdeye's agent builder component library was that kind of move: instead of designing every new agent by hand, we built the pieces once so new ones could be assembled instead of authored from scratch. I paint and take photographs outside of work, and it's the same muscle every time, seeing the structure underneath something before you touch its surface. The pixels are the last five percent, not the point.",
    cluster: 'Philosophy',
  },
  {
    id: 'raised-the-money-too',
    title: "I've raised the money too",
    preview: "Founder years changed what 'good design' means to me.",
    content: "Cofounding Canonic changed what 'good design' meant to me. It stopped being the most polished screen and became the screen that got us the next round, the next hundred users, the next retention number. I redesigned onboarding based on A/B tests and user interviews and watched completions rise 210%; I rebuilt the marketing site enough times that conversion went from around 5% to 20%. Both of those happened before a design review ever asked whether the pixels were right, because the pixels didn't matter yet if the business wasn't going to survive to use them. I bring that instinct into every review I sit in now: craft is necessary, but it isn't sufficient, and knowing which number a decision needs to move is half the design work.",
    cluster: 'Philosophy',
  },
  {
    id: 'speed-not-quality',
    title: 'Speed ≠ quality',
    preview: 'AI makes prototypes fast. Good design still takes time.',
    content: "I wrote a Claude Skill on top of Birdeye's agent builder that generates a working customer service agent from a single prompt, five agents in under thirty minutes. It sounds like it should collapse the whole design process into an afternoon. It doesn't. What it collapses is the distance between an idea and something clickable; someone still has to decide if the agent's first response is right, if the escalation path makes sense for a pediatric clinic instead of a generic business, if the tone is one a patient would actually trust. AI closed the gap between thinking and prototyping. It didn't close the gap between prototyping and correct, and that gap is still where the job is.",
    cluster: 'Craft',
  },
  {
    id: 'sprint-is-a-bet',
    title: 'The sprint is a bet',
    preview: 'Five days got us a direction. Weeks of iteration got the 20%.',
    content: "I ran a Google-style Design Sprint on Haptik's chat interface: map the problem, sketch alone, decide as a group, prototype, and put it in front of real users, all inside a week. It felt, at the end of that week, like we'd solved it. We hadn't. The sprint gave us conviction on one direction worth building instead of five we were still arguing about, but the actual redesign took weeks after that, shipping, watching how people used the new flow, going back to the analytics and the interviews when something didn't land, and adjusting until first message engagement was up 20%. The workshop is where you get unstuck. The metric is where you find out if you were right.",
    cluster: 'Craft',
  },
  {
    id: 'own-the-outcome',
    title: 'Own the outcome',
    preview: "Shipped isn't done. Adopted is.",
    content: "Shipping isn't done. Adopted is. I track activation, watch retention, read the support tickets that come in after launch, and go back to change a flow or a report's structure when the numbers don't move the way I expected. At Birdeye, that's why keyword and ranking reports aren't just raw metrics on a page. I pushed for funnel-based thinking, appearance, ranking, impressions as stages, because a number without a story attached doesn't tell a business owner what to do next, and if they can't act on it, I haven't actually finished the design. The decision isn't final when engineering closes the ticket. It's final when the behavior it was supposed to change actually changes.",
    cluster: 'Craft',
  },
]
