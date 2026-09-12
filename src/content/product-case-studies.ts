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
  Canonic: {},
}
