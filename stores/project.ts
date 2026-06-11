'use client'

import { create } from 'zustand'
import type { Project, Document, DocumentType } from '@/types'

interface ProjectStore {
  currentProject: Project | null
  projects: Project[]
  documents: Document[]
  selectedDocumentId: string | null
  selectedDocumentType: DocumentType | null
  isBinderOpen: boolean
  isNotesOpen: boolean

  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  setDocuments: (docs: Document[]) => void
  selectDocument: (id: string, type: DocumentType) => void
  updateDocument: (id: string, partial: Partial<Document>) => void
  toggleBinder: () => void
  toggleNotes: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  projects: [],
  documents: [],
  selectedDocumentId: null,
  selectedDocumentType: null,
  isBinderOpen: true,
  isNotesOpen: true,

  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setDocuments: (docs) => set({ documents: docs }),
  selectDocument: (id, type) =>
    set({ selectedDocumentId: id, selectedDocumentType: type }),
  updateDocument: (id, partial) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...partial } : d
      ),
    })),
  toggleBinder: () => set((state) => ({ isBinderOpen: !state.isBinderOpen })),
  toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
}))
