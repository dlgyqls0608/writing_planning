'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

const FOCUS_OPTIONS = ['기본 설정·시대', '주요 장소', '사회 구조', '세계의 규칙', '분위기·톤']

export function BibleWorldInput({ initialInput = '', onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [focuses, setFocuses] = useState<string[]>(['기본 설정·시대', '주요 장소'])

  function toggle(s: string) {
    setFocuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function buildInput() {
    const lines = [idea.trim()]
    if (focuses.length > 0) lines.push(`중점 작성 항목: ${focuses.join(', ')}`)
    return lines.filter(Boolean).join('\n')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          세계관 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          시대, 공간, 사회 구조, 이 세계만의 독특한 규칙이나 분위기를 자유롭게 적어주세요.
        </p>
        <textarea
          className="w-full min-h-[180px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#0891b2] focus:ring-2 focus:ring-[#0891b2]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예) 현대 한국을 배경으로 하지만 5년 전 갑자기 '게이트'가 열려 몬스터가 출현하는 세계. 헌터 협회가 국가보다 강한 영향력을 갖고 있으며, S급 헌터는 국가 원수급 대우를 받는다..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 600) + 'px' }}
        />
      </div>

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
                  ? 'bg-[#0891b2] text-white border-[#0891b2]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0891b2]'
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
          disabled={!idea.trim() || isLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white text-sm font-medium rounded-lg hover:bg-[#0e7490] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          세계관 생성
        </button>
      </div>
    </div>
  )
}
