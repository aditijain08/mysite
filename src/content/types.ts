export interface BaseProject {
  id: string
  name: string
  company: string
  tags: string[]
  description: string
  outcome: string
  color: string
  linkUrl: string
  linkLabel?: string
  featured?: boolean
  // Overview metadata surfaced at the top of the project, above Outcome/
  // Problem/Process/Solution — not buried in `detail`.
  role?: string
  team?: string
  timeline?: string
  status?: string
  // Keeps the entry in content (and out of git diffs/history) without
  // surfacing it in any UI — for drafts or projects pulled from display.
  hidden?: boolean
}

export interface CursorProject extends BaseProject {
  file: string
  group?: string
  problem?: string
  detail: string[]
}

export interface FigmaProject extends BaseProject {
  frames: string[]
}

export interface ProcessNote {
  id: string
  title: string
  preview: string
  content: string
  cluster?: 'Philosophy' | 'Craft'
}
