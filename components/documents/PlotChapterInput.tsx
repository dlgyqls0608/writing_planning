'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  initialInput?: string
  docTitle?: string
  targetEpisodes?: number
  onGenerate: (input: string) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function PlotChapterInput({
  initialInput = '',
  docTitle = '',
  targetEpisodes = 100,
  onGenerate,
  isLoading,
  onCancel,
}: Props) {
  const [chapterNum, setChapterNum] = useState(() => {
    const m = docTitle.match(/(\d+)/)
    return m ? m[1] : ''
  })
  const [startEp, setStartEp] = useState('')
  const [endEp, setEndEp] = useState('')
  const [prevSummary, setPrevSummary] = useState('')
  const [flow, setFlow] = useState(initialInput)
  const [nextComment, setNextComment] = useState('')

  function buildInput() {
    const lines: string[] = []
    if (chapterNum.trim()) lines.push(`챕터 번호: ${chapterNum.trim()}`)
    if (startEp.trim() && endEp.trim()) lines.push(`화수 범위: ${startEp.trim()}화~${endEp.trim()}화`)
    else if (startEp.trim()) lines.push(`시작 화수: ${startEp.trim()}화`)
    lines.push(`총 목표 화수: ${targetEpisodes}화`)
    if (prevSummary.trim()) lines.push(`\n이전 챕터 요약:\n${prevSummary.trim()}`)
    if (flow.trim()) lines.push(`\n이번 챕터 흐름:\n${flow.trim()}`)
    if (nextComment.trim()) lines.push(`\n다음 챕터 연결 방향:\n${nextComment.trim()}`)
    return lines.join('\n')
  }

  const canGenerate = !!flow.trim()

  return (
    <div className="space-y-5">
      {/* 챕터 번호 & 화수 범위 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">챕터 번호</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#16a34a] text-center"
              placeholder="1"
              value={chapterNum}
              onChange={(e) => setChapterNum(e.target.value)}
            />
            <span className="text-gray-400 shrink-0 text-sm">챕터</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">시작 화</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#16a34a] text-center"
              placeholder="1"
              value={startEp}
              onChange={(e) => setStartEp(e.target.value)}
            />
            <span className="text-gray-400 text-sm">화</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">종료 화</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#16a34a] text-center"
              placeholder="15"
              value={endEp}
              onChange={(e) => setEndEp(e.target.value)}
            />
            <span className="text-gray-400 text-sm">화</span>
          </div>
        </div>
      </div>

      {/* 이전 챕터 요약 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이전 챕터 요약
          <span className="ml-1.5 text-xs font-normal text-gray-400">(선택)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">직전 챕터에서 어떤 일이 일어났나요? 자연스럽게 이어지도록 반영됩니다.</p>
        <textarea
          className="w-full min-h-[90px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예: 1챕터에서 주인공이 각성하고, 빌런의 정체가 절반쯤 드러났다. 마지막 장면에서 예상치 못한 협력자가 등장했다."
          value={prevSummary}
          onChange={(e) => setPrevSummary(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 400) + 'px' }}
        />
      </div>

      {/* 이번 챕터 흐름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이번 챕터 핵심 흐름
          <span className="ml-1.5 text-xs font-normal text-red-400">*필수</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">이 챕터에서 일어나는 주요 사건, 갈등, 반전 포인트를 적어주세요.</p>
        <textarea
          className="w-full min-h-[150px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예: 협력자의 배신이 드러나고, 주인공이 혼자 적의 본거지에 잠입한다. 중반부에 예상치 못한 진실이 밝혀지면서 목표 자체가 바뀐다. 챕터 마지막에 새로운 위협이 등장한다."
          value={flow}
          onChange={(e) => setFlow(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 500) + 'px' }}
        />
      </div>

      {/* 다음 챕터 연결 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          다음 챕터 연결 방향
          <span className="ml-1.5 text-xs font-normal text-gray-400">(선택)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">다음 챕터로 어떻게 이어지길 원하는지 적어두면 복선 설계에 반영됩니다.</p>
        <textarea
          className="w-full min-h-[90px] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 resize-none overflow-hidden leading-relaxed"
          placeholder="예: 다음 챕터에서는 빌런과의 정면 대결이 시작되어야 하고, 주인공의 숨겨진 능력이 드러나길 원한다."
          value={nextComment}
          onChange={(e) => setNextComment(e.target.value)}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 400) + 'px' }}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">취소</button>
        )}
        <button
          onClick={() => onGenerate(buildInput())}
          disabled={!canGenerate || isLoading}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] text-white text-sm font-medium rounded-lg hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="size-4" />
          챕터 플롯 생성
        </button>
      </div>
    </div>
  )
}
