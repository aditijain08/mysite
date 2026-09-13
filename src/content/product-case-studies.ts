import type { Product } from './figma-files'

// The narrative shown on the Figma canvas when a page (product) is selected.
// Real case-study copy only — leave a section undefined rather than invent
// claims about problems, solutions, or outcomes; the UI falls back to
// "Not documented yet" until this is filled in per product.
export interface ProductCaseStudy {
  overview?: string
  problem?: string
  solution?: string
  outcome?: string
}

export const PRODUCT_CASE_STUDIES: Record<Product, ProductCaseStudy> = {
  Listings: {},
  Reviews: {},
  Inbox: {},
  Canonic: {
    overview: "Canonic's low-code frontend builder lets users drag and drop components to build interfaces without writing code. I led the design system for its component library as Lead Product Designer & Project Manager (3 months), with Monica Singh Dahiya (Sr. Design Consultant), Pratham Agrawal (Dev), and SimranJot Singh (PM) — establishing a standardized style guide and defining each component's states, interactions, and configuration options as the single reference point for design and development.",
    problem: "The existing component library had inconsistencies in states, colors, configurations, and adaptability, hurting the experience of anyone building with it. Without a unified style guide, maintaining and scaling the library was difficult. A design audit surfaced inconsistent spacing, states, strokes, colors, and curvature across components.",
    solution: "Built a comprehensive design system on atomic design principles: a style guide standardizing colors, typography, and spacing, and components crafted in Figma with every state, variant, property, and configuration defined. Introduced primary/secondary/tertiary variant designations for streamlined usage, plus a Branding Configuration section so fonts, sizes, colors, and spacing can be customized per project.",
    outcome: "Reduced number of bugs, code optimization, better-looking pages and final UI screens, easier configuration, and better configuration overrides.",
  },
}
