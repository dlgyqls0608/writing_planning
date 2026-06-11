'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

const SECTIONS = ['인물 설정', '세계관·배경', '파워 시스템', '용어 사전', '관계도']

export function StoryBibleInput({ initialInput = '', onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [sections, setSections] = useState<string[]>(['인물 설정', '세계관·배경'])

  function toggleSection(s: string) {
    setSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function buildInput() {
    return [
      idea.trim(),
      sections.length > 0 && `작성할 항목: ${sections.join(', ')}`,
    ].filter(Boolean).join('\n')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          인물·세계관 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          주요 인물의 특성, 세계관 설정, 독특한 시스템이나 용어 등을 자유롭게 적어주세요.
          이미 로그라인·시놉시스가 있다면 추가 설정만 적어도 됩니다.
        </p>
        <textarea
          className="w-full min-h-[180px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none leading-relaxed"
          placeholder="예) 주인공 이름은 이수아, 30대 초반 재벌가 비서. 빌런은 부회장 강태준으로 외적으로는 온화하지만 내면은 냉혹함. 세계관은 현대 한국 대기업..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">작성할 항목 (복수 선택)</label>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSection(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                sections.includes(s)
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#4f46e5]'
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
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          스토리 바이블 생성
        </button>
      </div>
    </div>
  )
}
