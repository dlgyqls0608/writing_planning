export type DocumentType =
  | 'logline'
  | 'synopsis'
  | 'plot'
  | 'plot-chapter'
  | 'treatment'
  | 'story-bible'
  | 'bible-world'
  | 'bible-power'
  | 'bible-glossary'
  | 'character-card'

export type DocumentStatus = 'empty' | 'draft' | 'generated' | 'finalized'

export interface Project {
  id: string
  user_id: string
  title: string
  genre: string
  target_episodes: number
  logline?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  project_id: string
  type: DocumentType
  title: string
  user_input: string
  content: string
  status: DocumentStatus
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  project_id: string
  name: string
  role: string
  archetype: string
  description: string
  motivation: string
  arc: string
  memo: string
  is_deceased: boolean
  deceased_episode?: number | null
  created_at: string
}

export interface Foreshadow {
  id: string
  project_id: string
  content: string
  planted_episode?: number
  resolved_episode?: number
  is_resolved: boolean
  created_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  content: string
  user_input: string
  saved_at: string
}

export type GenerateRequest = {
  type: DocumentType
  projectId: string
  userInput: string
  mode?: 'document' | 'questions'
  qa?: { question: string; answer: string }[]
  context?: {
    logline?: string
    genre?: string
  }
}
