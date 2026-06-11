'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

const ENDING_OPTIONS = ['해피엔딩', '새드엔딩', '열린 결말', '아직 미정']
const MOOD_OPTIONS = ['통쾌한 복수극', '서스펜스·스릴러', '로맨스 중심', '성장·힐링', '다크·비극']

export function SynopsisInput({ initialInput = '', onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [ending, setEnding] = useState('')
  const [moods, setMoods] = useState<string[]>([])
  const [romance, setRomance] = useState<'없음' | '서브' | '메인'>('서브')

  function toggleMood(m: string) {
    setMoods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  function buildInput() {
    const lines = [idea.trim()]
    if (ending) lines.push(`결말 방향: ${ending}`)
    if (moods.length > 0) lines.push(`분위기: ${moods.join(', ')}`)
    lines.push(`로맨스 비중: ${romance}`)
    return lines.join('\n')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이야기 전체 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">발단부터 결말까지 알고 있는 만큼 자유롭게 적어주세요.</p>
        <textarea
          className="w-full min-h-[160px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none leading-relaxed"
          placeholder="주인공, 핵심 갈등, 주요 사건, 결말에 대한 아이디어를 자유롭게 적어주세요."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
      </div>

      {/* 결말 방향 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">결말 방향</label>
        <div className="flex flex-wrap gap-2">
          {ENDING_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setEnding(ending === opt ? '' : opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                ending === opt
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#4f46e5]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 분위기 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">분위기 (복수 선택 가능)</label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                moods.includes(m)
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#4f46e5]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 로맨스 비중 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">로맨스 비중</label>
        <div className="flex gap-2">
          {(['없음', '서브', '메인'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRomance(opt)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                romance === opt
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#4f46e5]'
              }`}
            >
              {opt}
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
          시놉시스 생성
        </button>
      </div>
    </div>
  )
}
