'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  targetEpisodes?: number
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function PlotInput({ initialInput = '', targetEpisodes = 100, onGenerate, isLoading, onCancel }: Props) {
  const [idea, setIdea] = useState(initialInput)
  const [arcCount, setArcCount] = useState(3)
  const [firstArcEnd, setFirstArcEnd] = useState(20)

  function buildInput() {
    return [
      idea.trim(),
      `총 목표 화수: ${targetEpisodes}화`,
      `아크 수: ${arcCount}개`,
      `1아크 종료 시점: ${firstArcEnd}화`,
    ].join('\n')
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          전체 이야기 흐름 아이디어 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">주요 아크, 반전 포인트, 결말 방향 등 알고 있는 만큼 적어주세요.</p>
        <textarea
          className="w-full min-h-[160px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none leading-relaxed"
          placeholder="전체 이야기 흐름, 주요 아크, 결정적 장면 아이디어를 적어주세요."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
      </div>

      {/* 아크 설계 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">아크 수</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setArcCount(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  arcCount === n
                    ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#4f46e5]'
                }`}
              >
                {n}개
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1아크 종료 — <span className="text-[#4f46e5] font-semibold">{firstArcEnd}화</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={firstArcEnd}
            onChange={(e) => setFirstArcEnd(Number(e.target.value))}
            className="w-full accent-[#4f46e5]"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>5화</span><span>50화</span>
          </div>
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
          플롯 생성
        </button>
      </div>
    </div>
  )
}
