'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

const CATEGORY_OPTIONS = ['세계관 용어', '파워·능력 용어', '세력·조직명', '장소명', '고유 아이템']

export function BibleGlossaryInput({ initialInput = '', onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [categories, setCategories] = useState<string[]>(['세계관 용어', '파워·능력 용어'])

  function toggle(s: string) {
    setCategories((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function buildInput() {
    const lines = [idea.trim()]
    if (categories.length > 0) lines.push(`포함할 용어 분류: ${categories.join(', ')}`)
    return lines.filter(Boolean).join('\n')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          용어 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          작품에 등장하는 고유 명사, 전문 용어, 세계관 특수 표현 등을 자유롭게 나열하거나 설명해주세요.
        </p>
        <textarea
          className="w-full min-h-[180px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예) 게이트(몬스터가 나오는 차원 균열), 마나석(헌터의 능력 결정체), 헌터 협회(국가 공인 헌터 관리 기구), 던전(게이트 내부 공간), 각성(처음 능력을 얻는 것)..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 600) + 'px' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">포함할 용어 분류 (복수 선택)</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categories.includes(s)
                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#dc2626]'
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
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white text-sm font-medium rounded-lg hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          용어 사전 생성
        </button>
      </div>
    </div>
  )
}
