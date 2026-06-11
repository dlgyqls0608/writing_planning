'use client'

import type { Foreshadow } from '@/types'

interface Props {
  foreshadows: Foreshadow[]
}

export function ForeshadowTimeline({ foreshadows }: Props) {
  const withEpisode = foreshadows.filter(f => f.planted_episode != null)

  if (withEpisode.length === 0) {
    return (
      <div className="py-4 text-center text-[11px] text-gray-400 leading-relaxed">
        화수가 입력된 복선이 없습니다.<br />
        복선 추가 시 <span className="font-medium">심기 화수</span>를 입력해주세요.
      </div>
    )
  }

  const maxEp = Math.max(
    ...withEpisode.map(f => Math.max(f.planted_episode ?? 0, f.resolved_episode ?? 0)),
    20
  )
  const axisMax = Math.ceil(maxEp / 10) * 10
  const tickCount = Math.min(5, axisMax / 10)
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((axisMax / tickCount) * i)
  )

  return (
    <div className="space-y-2 pt-1">
      {/* 축 레이블 */}
      <div className="flex justify-between ml-[72px] mr-5 text-[9px] text-gray-400 mb-0.5">
        {ticks.map(t => (
          <span key={t}>{t}화</span>
        ))}
      </div>

      {/* 막대 행 */}
      <div className="space-y-2">
        {withEpisode.map(f => {
          const planted = f.planted_episode ?? 1
          const resolved = f.resolved_episode ?? planted
          const startPct = (planted / axisMax) * 100
          const endPct = (resolved / axisMax) * 100
          const widthPct = Math.max(endPct - startPct, 1.5)
          const span = resolved - planted
          const isResolved = f.is_resolved
          const isLongGap = span > 20

          const barColor = isResolved
            ? '#16a34a'
            : isLongGap
            ? '#dc2626'
            : '#f97316'

          return (
            <div key={f.id} className="flex items-center gap-1.5">
              {/* 복선 레이블 */}
              <div
                className="w-[68px] shrink-0 text-[10px] text-gray-600 truncate text-right leading-tight"
                title={f.content}
              >
                {f.content}
              </div>

              {/* 트랙 */}
              <div className="relative flex-1 h-4 bg-gray-100 rounded-sm mr-3">
                {/* 막대 */}
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-sm"
                  style={{ left: `${startPct}%`, width: `${widthPct}%`, backgroundColor: barColor }}
                  title={`${planted}화 심기${f.resolved_episode ? ` → ${f.resolved_episode}화 회수` : ' (미회수)'}`}
                />
                {/* 심기 마커 */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-gray-400"
                  style={{ left: `${startPct}%` }}
                />
              </div>

              {/* 회수 여부 아이콘 */}
              <span className="text-[11px] shrink-0">
                {isResolved ? '✅' : '⬜'}
              </span>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-2 border-t border-gray-100 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-[#16a34a]" />회수 완료
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-[#f97316]" />미회수
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-[#dc2626]" />장기 미회수(20화↑)
        </span>
      </div>
    </div>
  )
}
