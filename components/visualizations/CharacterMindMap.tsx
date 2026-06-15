'use client'

import dynamic from 'next/dynamic'
import type { Character, Document } from '@/types'

const CharacterMindMapInner = dynamic(
  () => import('./CharacterMindMapInner').then(m => m.CharacterMindMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        관계도 불러오는 중...
      </div>
    ),
  }
)

interface Props {
  characters: Character[]
  projectId: string
  charDocs?: Document[]
  onDocumentCreated?: (doc: Document) => void
  onDocumentDeleted?: (docId: string) => void
  onDocumentUpdated?: (docId: string, updates: Partial<Document>) => void
}

export function CharacterMindMap({ characters, projectId, charDocs, onDocumentCreated, onDocumentDeleted, onDocumentUpdated }: Props) {
  return (
    <CharacterMindMapInner
      key={projectId}
      characters={characters}
      projectId={projectId}
      charDocs={charDocs}
      onDocumentCreated={onDocumentCreated}
      onDocumentDeleted={onDocumentDeleted}
      onDocumentUpdated={onDocumentUpdated}
    />
  )
}
