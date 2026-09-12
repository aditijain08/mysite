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
}

export interface CursorProject extends BaseProject {
  file: string
  group?: string
  problem?: string
  process?: { intentMapping?: string; decisionFlow?: string; edgeCases?: string }
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
