import { cursorProjects, cursorFolderGroups } from './cursor-projects'
import { figmaProjects } from './figma-projects'
import { processNotes } from './process-notes'
import type { BaseProject } from './types'

export * from './types'
export { cursorProjects, cursorFolderGroups } from './cursor-projects'
export { figmaProjects } from './figma-projects'
export { processNotes } from './process-notes'
export { figmaFiles, FILE_KIND_LABEL, PRODUCTS } from './figma-files'
export type { FigmaFileEntry, FigmaFileKind, Product } from './figma-files'
export { PRODUCT_CASE_STUDIES } from './product-case-studies'
export type { ProductCaseStudy } from './product-case-studies'

export interface FeaturedProject extends BaseProject {
  medium: 'Cursor' | 'Figma'
}

// Cursor + Figma projects marked `featured`, merged into one list of
// link-out cards for the Work page.
export function featuredProjects(): FeaturedProject[] {
  return [
    ...cursorProjects.filter((p) => p.featured && !p.hidden).map((p) => ({ ...p, medium: 'Cursor' as const })),
    ...figmaProjects.filter((p) => p.featured && !p.hidden).map((p) => ({ ...p, medium: 'Figma' as const })),
  ]
}
