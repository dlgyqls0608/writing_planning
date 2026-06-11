'use client'

import { useState } from 'react'

interface CheckItem {
  id: string
  label: string
  desc: string
}

const COMMON: CheckItem[] = [
  { id: 'hook', label: '1화 후킹', desc: '3페이지 이내 독자를 붙잡는 사건 또는 반전' },
  { id: 'hero_diff', label: '주인공 차별점', desc: '"이 주인공만 할 수 있는 것" 1문장 정의' },
  { id: 'ep_satisfaction', label: '회차 완결감', desc: '매 화 독립적인 작은 카타르시스 존재' },
  { id: 'growth_vis', label: '성장 지표 시각화', desc: '능력치·랭크 등 독자가 성장을 체감할 수단' },
  { id: 'ten_ep_rule', label: '10화 법칙', desc: '10화 이내 세계관·주인공·핵심 갈등 완전 제시' },
  { id: 'villain_charm', label: '빌런 매력도', desc: '빌런의 논리가 이해 가능 → 독자 이탈 방지' },
  { id: 'emotion_breath', label: '감정 호흡 조절', desc: '긴장 3화 → 이완 1화 → 재상승 사이클' },
  { id: 'monetize', label: '과금 유도 설계', desc: '아크 종료 직전 강한 반전 배치' },
]

const GENRE_ITEMS: Record<string, CheckItem[]> = {
  '회귀물': [
    { id: 'regress_reason', label: '회귀 이유 명확성', desc: '독자가 납득할 수 있는 회귀 동기' },
    { id: 'knowledge_speed', label: '전생 지식 활용 속도', desc: '너무 늦으면 답답, 너무 빠르면 긴장감 소실' },
    { id: 'past_future_sym', label: '과거-미래 복선 대칭', desc: '전생 사건과 현생 사건의 대칭 구조' },
    { id: 'regress_count', label: '회귀 횟수 관리', desc: '복수 회귀 시 독자 혼란 방지 설계' },
  ],
  '로맨스': [
    { id: 'romance_hint', label: '로맨스 첫 암시', desc: '20화 이내 첫 감정선 암시' },
    { id: 'romance_flutter', label: '첫 설렘 장면', desc: '50화 이내' },
    { id: 'heroine_growth', label: '여주 서사 독립성', desc: '로맨스 외 독립적인 여주의 목표 존재' },
  ],
  '로맨스판타지': [
    { id: 'romance_hint', label: '로맨스 첫 암시', desc: '20화 이내 첫 감정선 암시' },
    { id: 'romance_flutter', label: '첫 설렘 장면', desc: '50화 이내' },
    { id: 'heroine_growth', label: '여주 서사 독립성', desc: '로맨스 외 독립적인 여주의 목표 존재' },
    { id: 'villain_possession', label: '악녀·빙의 활용', desc: '원작 지식 활용 방식 명확화' },
  ],
  '헌터물': [
    { id: 'dungeon_unique', label: '던전·시스템 독창성', desc: '기존 헌터물과 차별화되는 시스템 1개 이상' },
    { id: 'scale_roadmap', label: '스케일 상승 로드맵', desc: '거리 → 도시 → 국가 → 세계 위협 순서' },
    { id: 'growth_metric', label: '성장 가시화 지표', desc: '등급·수치로 성장이 눈에 보여야 함' },
  ],
  '판타지': [
    { id: 'world_rule', label: '세계관 규칙 일관성', desc: '마법·능력 체계의 규칙이 끝까지 유지' },
    { id: 'power_balance', label: '파워 밸런스 설계', desc: '주인공 성장이 스토리 긴장감과 공존' },
  ],
  '무협': [
    { id: 'martial_system', label: '무공 체계 명확성', desc: '문파·경지·기술 체계의 일관성' },
    { id: 'chivalry', label: '협(俠)의 가치', desc: '단순 실력자가 아닌 의리·명분의 주인공' },
  ],
}

interface SuccessChecklistProps {
  genre: string
}

export function SuccessChecklist({ genre }: SuccessChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const genreItems = GENRE_ITEMS[genre] ?? []
  const items = [...COMMON, ...genreItems]
  const checkedCount = items.filter((i) => checked.has(i.id)).length

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {checkedCount} / {items.length} 충족
        </span>
        <div className="h-1.5 flex-1 mx-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4f46e5] rounded-full transition-all"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={checked.has(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-0.5 shrink-0 accent-[#4f46e5]"
            />
            <div>
              <p
                className={`text-xs font-medium leading-tight transition-colors ${
                  checked.has(item.id) ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}
              >
                {item.label}
              </p>
              <p className="text-[10px] text-gray-400 leading-snug">{item.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {genreItems.length > 0 && (
        <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          ✦ {genre} 특화 항목 {genreItems.length}개 포함
        </p>
      )}
    </div>
  )
}
