'use client'

import { create } from 'zustand'
import type { Project, Document, DocumentType } from '@/types'

type SpecialView = 'character-map' | 'foreshadow-tracker'

interface ProjectStore {
  currentProject: Project | null
  projects: Project[]
  documents: Document[]
  selectedDocumentId: string | null
  selectedDocumentType: DocumentType | null
  selectedView: SpecialView | null
  isBinderOpen: boolean
  isNotesOpen: boolean

  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  setDocuments: (docs: Document[]) => void
  selectDocument: (id: string, type: DocumentType) => void
  setSelectedView: (view: SpecialView | null) => void
  updateDocument: (id: string, partial: Partial<Document>) => void
  addDocument: (doc: Document) => void
  toggleBinder: () => void
  toggleNotes: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  projects: [],
  documents: [],
  selectedDocumentId: null,
  selectedDocumentType: null,
  selectedView: null,
  isBinderOpen: true,
  isNotesOpen: true,

  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setDocuments: (docs) => set({ documents: docs }),
  selectDocument: (id, type) =>
    set({ selectedDocumentId: id, selectedDocumentType: type, selectedView: null }),
  setSelectedView: (view) =>
    set({ selectedView: view, selectedDocumentId: null, selectedDocumentType: null }),
  updateDocument: (id, partial) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...partial } : d
      ),
    })),
  addDocument: (doc) =>
    set((state) => ({ documents: [...state.documents, doc] })),
  toggleBinder: () => set((state) => ({ isBinderOpen: !state.isBinderOpen })),
  toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
}))
