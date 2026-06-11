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

export function TreatmentInput({ initialInput = '', docTitle = '', onGenerate, isLoading, onCancel }: Props) {
  const episodeMatch = docTitle.match(/(\d+)/)
  const [episode, setEpisode] = useState(episodeMatch ? episodeMatch[1] : '')
  const [prevSummary, setPrevSummary] = useState('')
  const [episodeFlow, setEpisodeFlow] = useState(initialInput)
  const [nextComment, setNextComment] = useState('')

  function buildInput() {
    const lines: string[] = []
    if (episode.trim()) lines.push(`이번 회차: ${episode.trim()}화`)
    if (prevSummary.trim()) lines.push(`전 회차 요약:\n${prevSummary.trim()}`)
    if (episodeFlow.trim()) lines.push(`이번 회차 흐름:\n${episodeFlow.trim()}`)
    if (nextComment.trim()) lines.push(`다음 전개 코멘트:\n${nextComment.trim()}`)
    return lines.join('\n\n')
  }

  const canGenerate = !!episodeFlow.trim()

  return (
    <div className="space-y-5">
      {/* 회차 번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">회차 번호</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#d97706] text-center"
            placeholder="예: 1"
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
          />
          <span className="text-gray-400">화</span>
        </div>
      </div>

      {/* 전 회차 요약 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          전 회차 요약
          <span className="ml-1.5 text-xs font-normal text-gray-400">(선택)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">직전 회차에서 어떤 일이 일어났나요? AI가 자연스럽게 이어지도록 작성해줍니다.</p>
        <textarea
          className="w-full min-h-[90px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예: 주인공이 적의 정체를 알아채고 대치 상황에서 도망쳤다. 마지막 장면에서 예상치 못한 인물이 등장해 끊겼다."
          value={prevSummary}
          onChange={(e) => setPrevSummary(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 500) + 'px' }}
        />
      </div>

      {/* 이번 회차 흐름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이번 회차 흐름
          <span className="ml-1.5 text-xs font-normal text-red-400">*필수</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">이번 화에서 일어나는 핵심 사건과 장면 흐름을 적어주세요.</p>
        <textarea
          className="w-full min-h-[130px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예: 도망친 주인공이 숨어든 창고에서 오래된 단서를 발견한다. 추격자와 숨바꼭질하다가 결정적 순간에 새로운 동료가 나타나 위기를 모면한다."
          value={episodeFlow}
          onChange={(e) => setEpisodeFlow(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 500) + 'px' }}
        />
      </div>

      {/* 다음 전개 코멘트 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          다음 전개 코멘트
          <span className="ml-1.5 text-xs font-normal text-gray-400">(선택)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">다음 화에서 어떤 방향으로 가고 싶은지 작성하면 복선·클리프행어 설계에 반영됩니다.</p>
        <textarea
          className="w-full min-h-[90px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예: 다음 화에서 새 동료의 진짜 목적이 드러나야 한다. 주인공이 단서의 의미를 깨닫는 복선을 이번 화에 심어두고 싶다."
          value={nextComment}
          onChange={(e) => setNextComment(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 500) + 'px' }}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">취소</button>
        )}
        <button
          onClick={() => onGenerate(buildInput())}
          disabled={!canGenerate || isLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#d97706] text-white text-sm font-medium rounded-lg hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          트리트먼트 생성
        </button>
      </div>
    </div>
  )
}
