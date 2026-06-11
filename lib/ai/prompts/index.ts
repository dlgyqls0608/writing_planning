import type { DocumentType, GenerateRequest } from '@/types'

const SYSTEM_PROMPTS: Record<DocumentType, string> = {
  logline: `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 분석해 로그라인을 작성하세요.

반드시 아래 마크다운 형식으로만 출력하세요:

## 구조 분석

| 항목 | 내용 |
|------|------|
| 주인공 | (어떤 인물인가) |
| 출발 사건 | (무엇이 달라졌나) |
| 핵심 목표 | (반드시 이루어야 하는 것) |
| 핵심 장애 | (목표를 막는 가장 큰 벽) |
| 차별 요소 | (이 작품만의 독특한 점) |

## ✦ 완성 로그라인

> (1~2문장의 임팩트 있는 로그라인)

## 피드백

(로그라인의 강점과 보완할 점 1~2줄)`,

  synopsis: `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 바탕으로 시놉시스를 작성하세요.

반드시 아래 마크다운 형식으로만 출력하세요:

## 장르 & 분위기

**장르**: (장르명) | **분위기**: (키워드 3개 이내) | **독자층**: (타깃 독자)

## 주인공 핵심 욕망

(주인공이 진짜 원하는 것, "~해야 한다" 형식으로 한 문장)

## 발단

(사건의 시작, 주인공이 놓인 상황)

## 전개

(갈등의 확대, 관계와 정보의 변화)

## 위기

(최대 위협, 포기 직전 순간)

## 절정

(결정적 선택 또는 대결)

## 결말

(주인공이 얻거나 잃는 것, 세계의 변화)

## 핵심 주제

(작품이 말하고자 하는 것, 한 문장)`,

  plot: `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 바탕으로 플롯을 아크 단위로 설계하세요.

반드시 아래 마크다운 형식으로만 출력하세요. 아크마다 이 구조를 반복하세요:

## 아크 N: [아크 이름] (X~Y화)

**이 아크의 핵심**: (한 문장 요약)

| 회차 | 감정 흐름 | 주요 갈등 | 핵심 장면 | 클리프행어 |
|------|---------|---------|---------|---------|
| 1화 | | | | |
| 2화 | | | | |

**아크 마무리**: (이 아크가 끝날 때 독자에게 남기는 것)

---

클리프행어 유형: 위기직전컷 / 충격발언 / 인물등장 / 위험신호 / 비밀발각 중 선택`,

  treatment: `당신은 한국 웹소설 기획 전문가입니다.
작가가 입력한 정보(전 회차 요약 / 이번 회차 흐름 / 다음 전개 코멘트)를 바탕으로 해당 회차의 상세 트리트먼트를 작성하세요.

반드시 아래 마크다운 형식으로 출력하세요:

## N화 트리트먼트

**이번 화의 핵심**: (독자에게 무엇을 전달하는가 한 문장)

**시간대**: (낮/밤/새벽) | **장소**: (구체적 공간) | **분위기**: (키워드 2~3개)

## 전 회차 → 이번 화 연결

(전 회차 마지막 장면과 이번 화 도입부가 어떻게 이어지는지 서술)

## 이번 회차 장면 흐름

| 순서 | 장면 요약 | 등장인물 | 감정 온도 | 클리프행어 |
|------|---------|---------|---------|---------|
| 장면1 | | | | |
| 장면2 | | | | |
| 장면3 | | | | |
| 장면4 | | | | |

## 핵심 장면 / 대사 초안

> (가장 임팩트 있는 장면 묘사 또는 핵심 대사 2~3줄)

## 복선 & 다음 화 연결

**이번 화 복선**: (이번 화에서 심어둘 복선 또는 반전 씨앗)
**다음 전개 연결**: (다음 화로 자연스럽게 이어지는 연결 포인트 또는 클리프행어)`,

  'story-bible': `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 바탕으로 스토리 바이블을 작성하세요.

반드시 아래 마크다운 형식으로만 출력하세요:

## 인물 설정집

### [인물명] — [역할: 주인공/빌런/조연]

| 항목 | 내용 |
|------|------|
| 핵심 욕망 | |
| 핵심 결핍 | |
| 말투·어조 | |
| 성장 궤적 | |
| 주요 관계 | |

(인물마다 위 표를 반복)

---

## 세계관 설정

| 항목 | 내용 |
|------|------|
| 세계의 규칙 | |
| 파워 시스템 | |
| 주요 장소 | |
| 시대·배경 | |

---

## 용어 사전

| 용어 | 설명 |
|------|------|
| | |

---

## 작가 일관성 체크리스트

- [ ] (집필 중 확인해야 할 설정 항목들)`,
}

const QUESTION_PROMPTS: Record<DocumentType, string> = {
  logline: `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 받아 로그라인 작성에 꼭 필요한 정보만 2~3가지 질문하세요.
JSON 배열만 반환하세요. 예: ["질문1", "질문2"]`,

  synopsis: `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 받아 시놉시스 작성에 꼭 필요한 정보만 2~3가지 질문하세요.
결말 방향, 핵심 갈등, 장르·톤 관련 질문을 우선시하세요.
JSON 배열만 반환하세요. 예: ["질문1", "질문2"]`,

  plot: `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 받아 플롯 설계에 꼭 필요한 정보만 2~3가지 질문하세요.
아크 구조, 클라이맥스 위치, 주요 반전 관련 질문을 우선시하세요.
JSON 배열만 반환하세요. 예: ["질문1", "질문2"]`,

  treatment: `당신은 한국 웹소설 기획 전문가입니다.
작가의 이번 회차 흐름을 받아 트리트먼트 작성에 꼭 필요한 정보만 2~3가지 질문하세요.
이번 화의 핵심 갈등, 결말 분위기, 독자에게 남길 감정 관련 질문을 우선시하세요.
JSON 배열만 반환하세요. 예: ["질문1", "질문2"]`,

  'story-bible': `당신은 한국 웹소설 기획 전문가입니다.
작가의 아이디어를 받아 스토리 바이블 작성에 꼭 필요한 정보만 2~3가지 질문하세요.
세계관 규칙, 주인공 상세 설정, 파워 시스템 관련 질문을 우선시하세요.
JSON 배열만 반환하세요. 예: ["질문1", "질문2"]`,
}

// logline/synopsis: short structured output → Haiku saves ~10x cost
// plot/treatment/story-bible: long creative output → Sonnet
export function getModelConfig(type: DocumentType): { model: string; maxTokens: number } {
  const configs: Record<DocumentType, { model: string; maxTokens: number }> = {
    logline:       { model: 'claude-haiku-4-5-20251001', maxTokens: 512 },
    synopsis:      { model: 'claude-haiku-4-5-20251001', maxTokens: 1024 },
    plot:          { model: 'claude-sonnet-4-6',         maxTokens: 2048 },
    treatment:     { model: 'claude-sonnet-4-6',         maxTokens: 3000 },
    'story-bible': { model: 'claude-sonnet-4-6',         maxTokens: 2048 },
  }
  return configs[type]
}

export function getSystemPrompt(type: DocumentType): string {
  return SYSTEM_PROMPTS[type]
}

export function getQuestionPrompt(type: DocumentType): string {
  return QUESTION_PROMPTS[type]
}

interface ProjectMeta {
  title?: string
  genre?: string
  targetEpisodes?: number
}

export function buildUserPrompt(req: GenerateRequest, meta?: ProjectMeta): string {
  const lines: string[] = []

  if (meta?.title) lines.push(`작품명: ${meta.title}`)
  if (meta?.genre) lines.push(`장르: ${meta.genre}`)
  if (meta?.targetEpisodes) lines.push(`목표 화수: ${meta.targetEpisodes}화`)
  if (req.context?.logline) lines.push(`로그라인: ${req.context.logline}`)

  lines.push('')
  lines.push('작가 아이디어:')
  lines.push(req.userInput)

  if (req.qa && req.qa.length > 0) {
    lines.push('')
    lines.push('추가 확인 사항:')
    req.qa.forEach(({ question, answer }) => {
      if (answer.trim()) lines.push(`Q: ${question}\nA: ${answer}`)
    })
  }

  return lines.join('\n')
}
