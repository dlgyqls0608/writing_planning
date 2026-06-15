import type { Character, Foreshadow } from '@/types'

export async function fetchCharacters(projectId: string): Promise<Character[]> {
  const res = await fetch(`/api/characters?projectId=${projectId}`)
  if (!res.ok) throw new Error('인물 목록 불러오기 실패')
  return res.json()
}

export async function fetchForeshadows(projectId: string): Promise<Foreshadow[]> {
  const res = await fetch(`/api/foreshadows?projectId=${projectId}`)
  if (!res.ok) throw new Error('복선 목록 불러오기 실패')
  return res.json()
}
