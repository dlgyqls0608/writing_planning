'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function BiblePowerInput({ initialInput = '', onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [hasLevels, setHasLevels] = useState<boolean | null>(true)
  const [hasWeakness, setHasWeakness] = useState<boolean | null>(true)
  const [protagonist, setProtagonist] = useState('')

  function buildInput() {
    const lines = [idea.trim()]
    if (hasLevels !== null) lines.push(`등급·레벨 체계 존재: ${hasLevels ? '있음' : '없음'}`)
    if (hasWeakness !== null) lines.push(`제약·단점 존재: ${hasWeakness ? '있음' : '없음'}`)
    if (protagonist.trim()) lines.push(`주인공 파워 특징: ${protagonist.trim()}`)
    return lines.filter(Boolean).join('\n')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          파워 시스템 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          능력의 종류, 작동 원리, 등급 체계, 획득 방법 등 알고 있는 만큼 적어주세요.
        </p>
        <textarea
          className="w-full min-h-[160px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예) 헌터들은 마나를 다루는 능력을 가지며 F~S등급으로 분류된다. S급은 전국에 5명뿐. 주인공은 처음에는 F급이지만 시스템 창이 보이는 유일한 능력을 가진다..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 600) + 'px' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">등급·레벨 체계</label>
          <div className="flex gap-2">
            {[{ label: '있음', val: true }, { label: '없음', val: false }].map(({ label, val }) => (
              <button
                key={label}
                type="button"
                onClick={() => setHasLevels(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  hasLevels === val
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#7c3aed]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">능력 제약·단점</label>
          <div className="flex gap-2">
            {[{ label: '있음', val: true }, { label: '없음', val: false }].map(({ label, val }) => (
              <button
                key={label}
                type="button"
                onClick={() => setHasWeakness(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  hasWeakness === val
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#7c3aed]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          주인공의 특별한 파워
          <span className="ml-1.5 text-xs font-normal text-gray-400">(선택)</span>
        </label>
        <input
          type="text"
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
          placeholder="예: 일반 헌터와 다른 고유 능력, 성장 방식의 특이점"
          value={protagonist}
          onChange={(e) => setProtagonist(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">취소</button>
        )}
        <button
          onClick={() => onGenerate(buildInput())}
          disabled={!idea.trim() || isLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          파워 시스템 생성
        </button>
      </div>
    </div>
  )
}
