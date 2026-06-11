'use client'

import dynamic from 'next/dynamic'
import type { Character } from '@/types'

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

export function CharacterMindMap({ characters }: { characters: Character[] }) {
  return <CharacterMindMapInner characters={characters} />
}
