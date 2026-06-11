# NovelForge — Code Architecture

## 1. 프로젝트 개요

**NovelForge**는 웹소설 작가가 원석 아이디어를 전문 기획 문서(로그라인 → 시놉시스 → 플롯 → 트리트먼트 → 스토리 바이블)로 정리할 수 있도록 돕는 AI 기반 웹 애플리케이션이다.

- AI는 작가의 아이디어를 **정리만** 할 뿐 창작하지 않는다
- Scrivener 스타일의 3패널 UI (바인더 | 편집창 | 메모패널)
- Notion 및 Google Docs 내보내기 지원
- 100화 이상 장편 시리즈 최적화

---

## 2. 기술 스택 (2026년 6월 기준 최신 안정화 버전)

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| **런타임** | Node.js | 24 LTS | Active LTS (Next.js 16 최소 요구: 20.9+) |
| **프레임워크** | Next.js | 16.2.7 | App Router + Turbopack 기본 탑재, 프론트/백 통합 |
| **언어** | TypeScript | 6.0.3 | 타입 안전성, IDE 자동완성 |
| **UI 라이브러리** | React | 19.2.7 | Next.js 16 기본 번들 |
| **스타일링** | Tailwind CSS | 4.3 | 빌드 5배 빠름, 유틸리티 우선 CSS |
| **컴포넌트** | shadcn/ui | CLI v4 | 복사 붙여넣기 방식, 커스터마이징 자유도 최고 |
| **클라이언트 상태** | Zustand | 5.0.14 | 가볍고 직관적인 전역 상태 관리 |
| **서버 상태** | TanStack Query | 5.101.0 | API 캐싱, 로딩/에러 상태 자동 처리 |
| **AI** | @anthropic-ai/sdk | 0.102.0 | Claude API 공식 SDK |
| **AI 모델** | claude-sonnet-4-6 ★ | — | 품질·비용 최적 균형 (opus 대비 5배 저렴) |
| **Notion 연동** | @notionhq/client | 5.22.0 | Notion API 2025-09-03+ 버전 필수 |
| **DB/인증** | Supabase + @supabase/ssr | — | PostgreSQL, 무료 티어, Next.js 16 SSR 인증 |
| **배포** | Vercel | — | Next.js 네이티브 플랫폼 (Hobby: 비상업적 무료) |

---

## 3. 시스템 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        브라우저 (클라이언트)                    │
│                                                             │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Binder     │  │   Editor Panel   │  │  Notes Panel  │  │
│  │  (바인더)    │  │   (편집 공간)     │  │   (메모 패널)  │  │
│  │             │  │                  │  │               │  │
│  │ • 프로젝트  │  │ • 문서 편집       │  │ • AI 생성 옵션│  │
│  │ • 문서 트리 │  │ • AI 생성 결과   │  │ • 캐릭터 메모 │  │
│  │ • 이동/삭제 │  │ • 실시간 스트림  │  │ • 참고 자료   │  │
│  └─────────────┘  └──────────────────┘  └───────────────┘  │
│                                                             │
│              Zustand (전역 상태) + TanStack Query            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 서버 (API Routes)                 │
│                                                             │
│   POST /api/generate   →  Claude API 호출 (스트리밍)         │
│   GET/POST /api/projects →  프로젝트 CRUD                    │
│   POST /api/export/notion → Notion 내보내기                  │
│   POST /api/export/docs  → Google Docs 내보내기              │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼──────────────────┐
            ▼                 ▼                  ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐
    │  Claude API   │ │  Supabase    │ │   Notion API     │
    │ (Anthropic)   │ │ (PostgreSQL) │ │  / Google Drive  │
    └───────────────┘ └──────────────┘ └──────────────────┘
```

---

## 4. 디렉토리 구조

```
writing_v001/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # 루트 레이아웃 (폰트, 테마)
│   ├── page.tsx                     # 대시보드 (프로젝트 목록)
│   ├── projects/
│   │   └── [id]/
│   │       └── page.tsx             # 3패널 에디터 메인 화면
│   └── api/
│       ├── generate/
│       │   └── route.ts             # AI 문서 생성 엔드포인트
│       ├── projects/
│       │   └── route.ts             # 프로젝트 CRUD
│       └── export/
│           ├── notion/
│           │   └── route.ts         # Notion 내보내기
│           └── docs/
│               └── route.ts         # Google Docs 내보내기
│
├── components/
│   ├── layout/
│   │   ├── ThreePanel.tsx           # 3패널 레이아웃 컨테이너
│   │   ├── Binder.tsx               # 왼쪽 패널: 문서 트리
│   │   ├── Editor.tsx               # 가운데 패널: 편집/생성
│   │   └── NotesPanel.tsx           # 오른쪽 패널: 메모/옵션
│   ├── documents/
│   │   ├── LoglineForm.tsx          # 로그라인 입력 폼
│   │   ├── SynopsisForm.tsx         # 시놉시스 생성 폼
│   │   ├── PlotForm.tsx             # 플롯 생성 폼
│   │   ├── TreatmentForm.tsx        # 트리트먼트 생성 폼
│   │   └── StoryBibleForm.tsx       # 스토리 바이블 폼
│   ├── streaming/
│   │   └── StreamingText.tsx        # AI 스트리밍 출력 컴포넌트
│   └── ui/                          # shadcn/ui 자동 생성 컴포넌트
│
├── lib/
│   ├── ai/
│   │   ├── client.ts                # Anthropic SDK 초기화
│   │   └── prompts/                 # Claude 프롬프트 템플릿
│   │       ├── logline.ts           # 로그라인 프롬프트
│   │       ├── synopsis.ts          # 시놉시스 프롬프트
│   │       ├── plot.ts              # 플롯 프롬프트
│   │       ├── treatment.ts         # 트리트먼트 프롬프트
│   │       └── story-bible.ts       # 스토리 바이블 프롬프트
│   ├── notion/
│   │   └── client.ts                # Notion SDK 초기화 + 내보내기 함수
│   └── supabase/
│       ├── client.ts                # 클라이언트용 Supabase 초기화
│       └── server.ts                # 서버용 Supabase 초기화
│
├── stores/
│   └── project.ts                   # Zustand 전역 상태 (현재 프로젝트, 선택 문서)
│
├── types/
│   └── index.ts                     # 전체 TypeScript 타입 정의
│
├── middleware.ts                     # Supabase 세션 갱신 (updateSession)
├── .env.local                       # 환경 변수 (git에 올리지 않음)
├── next.config.ts                   # Next.js 설정
├── tailwind.config.ts               # Tailwind CSS 설정
└── package.json                     # 의존성 목록
```

---

## 5. 데이터 모델 (TypeScript 타입)

```typescript
// 프로젝트 (하나의 웹소설 작품)
interface Project {
  id: string
  title: string           // 작품 제목
  genre: string           // 판타지 | 로맨스 | 현대물 | 무협 | SF
  targetEpisodes: number  // 목표 화수 (기본 100)
  logline?: string        // 완성된 로그라인
  createdAt: string
  updatedAt: string
}

// 개별 기획 문서
interface Document {
  id: string
  projectId: string
  type: DocumentType
  title: string
  userInput: string       // 작가가 제공한 원석 아이디어
  content: string         // AI가 정리한 결과물
  status: 'empty' | 'draft' | 'generated' | 'finalized'
  createdAt: string
  updatedAt: string
}

type DocumentType =
  | 'logline'       // 로그라인
  | 'synopsis'      // 시놉시스
  | 'plot'          // 플롯
  | 'treatment'     // 트리트먼트
  | 'story-bible'   // 스토리 바이블

// 캐릭터 (스토리 바이블 내부)
interface Character {
  id: string
  projectId: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting'
  archetype: string       // 예: "성장형 주인공", "비극적 악당"
  description: string
  motivation: string
  arc: string             // 캐릭터 변화 여정
}
```

---

## 6. API 명세

### `POST /api/generate`
Claude API를 호출하여 문서를 스트리밍으로 생성한다.

**Request Body:**
```json
{
  "type": "synopsis",
  "projectId": "uuid",
  "userInput": "주인공은 기억을 잃은 마법사이고...",
  "context": {
    "logline": "기존 로그라인 내용 (있는 경우)",
    "genre": "판타지"
  }
}
```

**Response:** `text/event-stream` (Server-Sent Events 스트리밍)

---

### `GET /api/projects`
전체 프로젝트 목록 반환

### `POST /api/projects`
새 프로젝트 생성

### `PUT /api/projects/[id]`
프로젝트 정보 수정

### `DELETE /api/projects/[id]`
프로젝트 삭제

---

### `POST /api/export/notion`
선택한 문서를 Notion 페이지로 내보내기

**Request Body:**
```json
{
  "documentId": "uuid",
  "notionPageId": "notion-parent-page-id"
}
```

---

## 7. 환경 변수 (.env.local)

```bash
# Claude AI (필수) — 서버 전용, 절대 클라이언트에 노출 금지
ANTHROPIC_API_KEY=sk-ant-...

# Supabase 데이터베이스 (필수)
# 2026년 말 이후 신규 프로젝트는 sb_publishable_xxx / sb_secret_xxx 형식 사용
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # 또는 sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # 또는 sb_secret_xxx (서버 전용)

# Notion 연동 (선택)
NOTION_API_KEY=secret_...

# Google Drive 연동 (선택)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> **주의**: `.env.local` 파일은 절대 git에 커밋하지 않는다. `.gitignore`에 포함되어야 한다.

---

## 8. Supabase 데이터베이스 스키마

```sql
-- 프로젝트 테이블
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  target_episodes INTEGER DEFAULT 100,
  logline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 테이블
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('logline','synopsis','plot','treatment','story-bible')),
  title TEXT NOT NULL,
  user_input TEXT DEFAULT '',
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'empty',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐릭터 테이블
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  archetype TEXT,
  description TEXT,
  motivation TEXT,
  arc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security 활성화 (필수)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
```

---

## 9. 주요 데이터 흐름

### AI 문서 생성 흐름
```
1. 사용자가 편집창에 아이디어 입력
2. "AI로 정리하기" 버튼 클릭
3. POST /api/generate 호출
4. 서버에서 Claude API 스트리밍 요청
5. SSE(Server-Sent Events)로 실시간 텍스트 전송
6. 클라이언트 StreamingText 컴포넌트가 실시간 렌더링
7. 완료 시 Supabase에 자동 저장
```

### Notion 내보내기 흐름
```
1. 사용자가 문서에서 "Notion으로 내보내기" 클릭
2. Notion 연결 다이얼로그 표시 (최초 1회)
3. POST /api/export/notion 호출
4. 서버에서 @notionhq/client로 Notion 페이지 생성
5. 생성된 Notion 페이지 URL 반환
6. 사용자에게 링크 표시
```

---

## 10. 배포 구성

| 서비스 | 용도 | 무료 티어 | 제약 사항 |
|--------|------|-----------|---------|
| **Vercel** | Next.js 앱 호스팅 | 월 100GB 대역폭 | 초과 시 앱 오프라인, 함수 60초 제한, **비상업적 개인만 허용** |
| **Supabase** | PostgreSQL 데이터베이스 | 500MB, 프로젝트 2개 | **1주일 미접속 시 자동 일시정지**, 자동 백업 없음 |
| **Anthropic** | Claude AI API | 없음 (사용량 과금) | 월 예상 $1~5 (sonnet 기준, 일 10~20회 생성 시) |
| **Notion** | 문서 내보내기 | API 무료 | — |

> **상업화 시 주의**: Vercel은 Hobby 플랜이 비상업적 개인 사용 전용이다. 유료 서비스로 운영할 경우 Pro 플랜($20/월)으로 업그레이드해야 한다.

### 배포 단계
```
1. GitHub에 코드 푸시
2. Vercel에서 GitHub 저장소 연결 → 자동 빌드/배포
3. Vercel 대시보드에서 환경 변수 설정
4. Supabase에서 데이터베이스 테이블 생성 (위 SQL 실행)
5. 도메인: yourapp.vercel.app (기본 제공)
```

---

## 11. 개발 시작 순서 (Phase)

| Phase | 작업 | 예상 소요 |
|-------|------|-----------|
| **0** | 환경 세팅 (Node.js 24, Next.js 프로젝트 생성) | 30분 |
| **1** | Supabase 연결 + 기본 CRUD API + RLS 설정 | 2시간 |
| **2** | 3패널 UI 레이아웃 구현 | 3시간 |
| **3** | Claude AI 스트리밍 문서 생성 구현 | 2시간 |
| **4** | 5개 문서 타입별 폼 구현 | 4시간 |
| **5** | Notion 내보내기 연동 | 2시간 |
| **6** | Vercel 배포 | 1시간 |

---

## 12. 의존성 설치 명령어

```bash
# 프로젝트 생성
npx create-next-app@latest writing_v001 --typescript --tailwind --app --src-dir

# 핵심 패키지 설치
npm install @anthropic-ai/sdk @notionhq/client @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query

# UI 컴포넌트
npx shadcn@latest init

# 타입 패키지
npm install -D @types/node
```

---

## 13. Claude API 비용 분석

### 모델별 가격 (2026년 6월 기준, 토큰 100만 개당)

| 모델 | 입력 | 출력 | 추천 용도 |
|------|------|------|---------|
| claude-haiku-4-5 | $1 | $5 | 단순 요약, 빠른 응답 |
| **claude-sonnet-4-6 ★** | **$3** | **$15** | **기획 문서 생성 (기본값)** |
| claude-opus-4-8 | $5 | $25 | 최고 품질 필요 시 (선택) |

### 1회 문서 생성 예상 비용 (sonnet 기준)

| 문서 종류 | 예상 비용 |
|---------|---------|
| 로그라인 | ~$0.01 |
| 시놉시스 | ~$0.05 |
| 플롯 | ~$0.08 |
| 트리트먼트 | ~$0.15 |
| 스토리 바이블 | ~$0.20 |

→ 하루 20회 생성 시 약 **$1~3/월** 수준

### 프롬프트 캐싱으로 비용 절감

Claude API는 **프롬프트 캐싱**을 지원한다. 동일한 시스템 프롬프트(장르 설정, 작성 규칙 등)가 반복되면 캐시 조회 비용은 **기본 입력 가격의 10%** 만 청구된다.

- 캐시 적중 시: 최대 **90% 비용 절감**
- 컨텍스트 윈도우: **1M 토큰** (A4 약 750장 분량, 장편 소설 전체를 담을 수 있는 크기)

---

## 14. Next.js 16 주요 변경사항 (코딩 시 반드시 확인)

Next.js 16은 이전 버전과 다음 항목들이 **파괴적으로 변경**되었다. 코드 작성 시 주의가 필요하다.

### 비동기 API 전환 (가장 중요)
```typescript
// ❌ Next.js 15 이하 방식 (동작 안 함)
const { id } = params
const cookieStore = cookies()

// ✅ Next.js 16 방식 (반드시 await 사용)
const { id } = await params
const cookieStore = await cookies()
const headersList = await headers()
```

### 캐싱 방식 변경
```typescript
// ❌ 이전: fetch가 기본적으로 캐싱됨 (암묵적)
fetch('https://api.example.com/data')

// ✅ Next.js 16: 명시적 캐시 선언 필요
'use cache'
fetch('https://api.example.com/data')
```

### 기타 변경사항
- `middleware.ts` → `proxy.ts` 로 교체 (단, Supabase Auth는 여전히 middleware.ts 권장)
- Node.js 18 지원 종료 → **20.9 이상 필수** (Node 24 LTS 권장)
- 레거시 AMP, 런타임 설정 제거됨

---

## 15. 보안 고려사항

### 1. Supabase Row Level Security (RLS) 필수
Supabase는 기본적으로 모든 테이블 접근을 차단한다. 반드시 명시적 정책을 작성해야 한다.

```sql
-- 예시: 본인 프로젝트만 접근 가능
CREATE POLICY "본인 프로젝트만 조회" ON projects
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. API 키 보호
- `ANTHROPIC_API_KEY`는 서버 전용 변수 (절대 `NEXT_PUBLIC_` 접두어 금지)
- `.env.local`은 `.gitignore`에 반드시 포함
- Vercel 대시보드에서만 환경 변수 설정

### 3. Supabase 세션 관리
`middleware.ts`에 `updateSession()` 구현이 필수다. 없으면 로그인 세션이 만료되어도 갱신이 안 된다.

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

### 4. Vercel 서버리스 함수 제한
- 함수 최대 실행 시간: **60초** (Hobby 플랜)
- Claude API 스트리밍 응답이 60초를 초과하면 타임아웃 발생
- 트리트먼트같은 긴 문서 생성 시 응답 속도 최적화 필요
