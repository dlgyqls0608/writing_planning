'use client'

import type { Foreshadow } from '@/types'

interface Props {
  foreshadows: Foreshadow[]
}

export function ForeshadowTimeline({ foreshadows }: Props) {
  const withEpisode = foreshadows.filter(f => f.planted_episode != null)
  const noEpisode = foreshadows.filter(f => f.planted_episode == null)

  if (foreshadows.length === 0) {
    return (
      <div className="py-4 text-center space-y-1.5">
        <div className="text-2xl">📊</div>
        <p className="text-[11px] text-gray-500 font-medium">등록된 복선이 없어요</p>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          오른쪽 패널에서 복선을 추가하면<br />
          이 화면에 시각화됩니다
        </p>
        <div className="mt-2 mx-auto max-w-[190px] rounded-lg border border-dashed border-gray-200 bg-gray-50 p-2 text-left">
          <p className="text-[9px] text-gray-400 leading-relaxed">
            예시: &quot;주인공의 낡은 반지&quot;<br />
            🌱 심는 화수: 3화<br />
            📌 회수 화수: 25화<br />
            <span className="text-orange-400">━━━━━━━━━</span> (3화~25화 구간)
          </p>
        </div>
      </div>
    )
  }

  const maxEp = withEpisode.length > 0
    ? Math.max(...withEpisode.map(f => Math.max(f.planted_episode ?? 0, f.resolved_episode ?? 0)), 20)
    : 20
  const axisMax = Math.ceil(maxEp / 10) * 10
  const tickCount = Math.min(5, axisMax / 10)
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((axisMax / tickCount) * i)
  )

  return (
    <div className="space-y-2 pt-1">
      {/* 설명 */}
      <p className="text-[10px] text-gray-400 leading-relaxed">
        <span className="text-orange-500 font-medium">등장한 화수</span>부터{' '}
        <span className="text-green-600 font-medium">회수된 화수</span>까지 구간을 보여줍니다
      </p>

      {withEpisode.length > 0 && (
        <>
          {/* 축 레이블 */}
          <div className="flex justify-between ml-[72px] mr-5 text-[9px] text-gray-400">
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

              const barColor = isResolved ? '#16a34a' : isLongGap ? '#dc2626' : '#f97316'
              const showLabel = widthPct > 10

              return (
                <div key={f.id} className="flex items-center gap-1.5">
                  <div
                    className="w-[68px] shrink-0 text-[10px] text-gray-600 truncate text-right leading-tight"
                    title={f.content}
                  >
                    {f.content}
                  </div>
                  <div className="relative flex-1 h-5 bg-gray-100 rounded-sm mr-3">
                    {ticks.slice(1, -1).map(t => (
                      <div
                        key={t}
                        className="absolute top-0 bottom-0 w-px bg-gray-200"
                        style={{ left: `${(t / axisMax) * 100}%` }}
                      />
                    ))}
                    <div
                      className="absolute top-1 bottom-1 rounded-sm flex items-center justify-center overflow-hidden"
                      style={{ left: `${startPct}%`, width: `${widthPct}%`, backgroundColor: barColor }}
                      title={`${planted}화 등장${f.resolved_episode ? ` → ${f.resolved_episode}화 회수` : ' (미회수)'}`}
                    >
                      {showLabel && (
                        <span className="text-[8px] text-white font-medium px-0.5 truncate">
                          {f.resolved_episode ? `${planted}→${f.resolved_episode}화` : `${planted}화~`}
                        </span>
                      )}
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-px bg-gray-400"
                      style={{ left: `${startPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] shrink-0" title={isResolved ? '회수 완료' : '미회수'}>
                    {isResolved ? '✅' : '⬜'}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 화수 미지정 복선 */}
      {noEpisode.length > 0 && (
        <div className={noEpisode.length > 0 && withEpisode.length > 0 ? 'pt-2 border-t border-gray-100' : ''}>
          <p className="text-[9px] text-gray-400 mb-1.5">
            {withEpisode.length > 0 ? '화수 미지정' : '화수 미지정 — 🌱 심는 화수를 입력하면 바 차트로 표시됩니다'}
          </p>
          <div className="space-y-1">
            {noEpisode.map(f => (
              <div key={f.id} className="flex items-center gap-1.5 px-1">
                <div className={`size-2 rounded-full shrink-0 ${f.is_resolved ? 'bg-green-500' : 'bg-orange-400'}`} />
                <span
                  className={`text-[10px] truncate ${f.is_resolved ? 'line-through text-gray-400' : 'text-gray-600'}`}
                  title={f.content}
                >
                  {f.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      {withEpisode.length > 0 && (
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
      )}
    </div>
  )
}
