'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface EpisodePoint {
  label: string
  episode: number
  tension: number
  emotion: string
}

function mapEmotionToTension(emotion: string): number {
  if (!emotion) return 5
  if (/절정|최고조|클라이맥스|대결|충격/.test(emotion)) return 10
  if (/위기|공포|절망|배신|분노/.test(emotion)) return 9
  if (/카타르시스|통쾌|역전/.test(emotion)) return 8
  if (/긴장|불안|의심|고조/.test(emotion)) return 7
  if (/경계|탐색|각성|갈등/.test(emotion)) return 6
  if (/호기심|낯섦|시작/.test(emotion)) return 5
  if (/슬픔|혼란|의아함/.test(emotion)) return 4
  if (/이완|웃음|평화|설렘|기쁨|로맨스/.test(emotion)) return 3
  return 5
}

function parsePlotContent(content: string): EpisodePoint[] {
  const tableMatch = content.match(/##\s*회차별\s*플롯([\s\S]*?)(?=##|$)/)
  if (!tableMatch) return []

  const lines = tableMatch[1].split('\n')
  const points: EpisodePoint[] = []

  for (const line of lines) {
    if (!line.includes('|') || line.includes('---')) continue
    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 2) continue

    const epMatch = cells[0].match(/(\d+)\s*화/)
    if (!epMatch) continue

    const episode = parseInt(epMatch[1])
    const emotion = cells[1] ?? ''
    points.push({ label: `${episode}화`, episode, tension: mapEmotionToTension(emotion), emotion })
  }

  return points.sort((a, b) => a.episode - b.episode)
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: EpisodePoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-800">{d.label}</p>
      {d.emotion && <p className="text-gray-500 mt-0.5">{d.emotion}</p>}
      <p className="text-indigo-600 font-medium mt-0.5">긴장도 {d.tension}/10</p>
    </div>
  )
}

export function EmotionCurve({ content }: { content: string }) {
  const data = parsePlotContent(content)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-sm text-gray-400 text-center leading-relaxed">
        회차별 플롯 표에서<br />감정 흐름 데이터를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-gray-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#dc2626]" />절정·위기
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />일반
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#16a34a]" />이완
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 3, 5, 7, 9, 10]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={5} stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: '중립', position: 'right', fontSize: 10, fill: '#d1d5db' }} />
          <Line
            type="monotone"
            dataKey="tension"
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: EpisodePoint }
              const color = payload.tension >= 9 ? '#dc2626' : payload.tension <= 3 ? '#16a34a' : '#4f46e5'
              const r = payload.tension >= 9 ? 6 : 4
              return <circle key={`dot-${payload.episode}`} cx={cx} cy={cy} r={r} fill={color} stroke="white" strokeWidth={2} />
            }}
            activeDot={{ r: 7, fill: '#4f46e5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
