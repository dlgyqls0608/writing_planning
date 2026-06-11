'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  docTitle?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

type Role = '주인공' | '조연' | '빌런' | '기타'

const ROLES: Role[] = ['주인공', '조연', '빌런', '기타']

const FOCUS_OPTIONS = ['심리 구조', '말투·행동', '관계망', '성장 궤적']

export function CharacterCardInput({ initialInput = '', docTitle = '', onGenerate, isLoading, onCancel }: Props) {
  const [name, setName] = useState(docTitle || '')
  const [role, setRole] = useState<Role>('주인공')
  const [idea, setIdea] = useState(initialInput)
  const [focuses, setFocuses] = useState<string[]>(['심리 구조', '관계망'])

  function toggle(s: string) {
    setFocuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function buildInput() {
    const lines: string[] = []
    if (name.trim()) lines.push(`인물명: ${name.trim()}`)
    lines.push(`역할: ${role}`)
    lines.push(`\n인물 아이디어:\n${idea.trim()}`)
    if (focuses.length > 0) lines.push(`\n중점 작성 항목: ${focuses.join(', ')}`)
    return lines.join('\n')
  }

  const canGenerate = !!idea.trim()

  return (
    <div className="space-y-5">
      {/* 인물명 & 역할 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">인물명</label>
          <input
            type="text"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#db2777]"
            placeholder="예: 이수아"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">역할</label>
          <div className="flex gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  role === r
                    ? 'bg-[#db2777] text-white border-[#db2777]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#db2777]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 인물 아이디어 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          인물 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          외형, 성격, 배경, 욕망, 다른 인물과의 관계 등 알고 있는 만큼 자유롭게 적어주세요.
        </p>
        <textarea
          className="w-full min-h-[160px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#db2777] focus:ring-2 focus:ring-[#db2777]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예) 30대 초반 여성, 재벌 부회장 비서. 겉으로는 냉정하고 유능하지만 내면은 가족에 대한 죄책감을 품고 있다. 빌런과는 어린 시절 인연이 있다..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 600) + 'px' }}
        />
      </div>

      {/* 중점 항목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">중점 작성 항목 (복수 선택)</label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                focuses.includes(s)
                  ? 'bg-[#db2777] text-white border-[#db2777]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#db2777]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">취소</button>
        )}
        <button
          onClick={() => onGenerate(buildInput())}
          disabled={!canGenerate || isLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#db2777] text-white text-sm font-medium rounded-lg hover:bg-[#be185d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          캐릭터 카드 생성
        </button>
      </div>
    </div>
  )
}
