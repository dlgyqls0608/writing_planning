'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  initialInput?: string
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function LoglineInput({ initialInput = '', onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [showGuide, setShowGuide] = useState(false)
  const [protagonist, setProtagonist] = useState('')
  const [event, setEvent] = useState('')
  const [goal, setGoal] = useState('')
  const [obstacle, setObstacle] = useState('')
  const [unique, setUnique] = useState('')

  function buildInput() {
    const parts = [idea.trim()]
    if (protagonist.trim()) parts.push(`주인공: ${protagonist.trim()}`)
    if (event.trim()) parts.push(`출발 사건: ${event.trim()}`)
    if (goal.trim()) parts.push(`핵심 목표: ${goal.trim()}`)
    if (obstacle.trim()) parts.push(`핵심 장애: ${obstacle.trim()}`)
    if (unique.trim()) parts.push(`차별 요소: ${unique.trim()}`)
    return parts.join('\n')
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이야기 아이디어 <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full min-h-[140px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="주인공이 어떤 인물이고, 어떤 사건이 일어나는지 자유롭게 적어주세요.&#10;예) 억울하게 죽은 재벌 비서가 10년 전으로 회귀해 진범을 찾아 복수하는 이야기"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 600) + 'px' }}
        />
      </div>

      {/* 세부 설정 */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">세부 설정으로 더 정확한 로그라인 만들기 (선택)</span>
          {showGuide ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {showGuide && (
          <div className="px-4 pb-4 pt-1 space-y-3 bg-gray-50">
            {[
              { label: '주인공은 어떤 사람인가요?', val: protagonist, set: setProtagonist, ph: '예: 재벌가의 비밀을 아는 평범한 비서' },
              { label: '무슨 사건이 일어나나요?', val: event, set: setEvent, ph: '예: 억울하게 죽음, 10년 전으로 회귀' },
              { label: '주인공의 핵심 목표는?', val: goal, set: setGoal, ph: '예: 자신을 죽인 진범을 찾아 복수' },
              { label: '가장 큰 장애물은?', val: obstacle, set: setObstacle, ph: '예: 재벌 권력망 안에서 진실 접근 불가' },
              { label: '이 작품만의 차별점은?', val: unique, set: setUnique, ph: '예: 예상 복수 대상이 진범이 아님' },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#4f46e5] bg-white"
                  placeholder={ph}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
            취소
          </button>
        )}
        <button
          onClick={() => onGenerate(buildInput())}
          disabled={!idea.trim() || isLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          로그라인 생성
        </button>
      </div>
    </div>
  )
}
