-- NovelForge Supabase 스키마
-- Supabase SQL Editor에서 실행하세요

-- ── 테이블 생성 ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  target_episodes INTEGER DEFAULT 100,
  logline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'logline','synopsis','plot','plot-chapter','treatment',
    'story-bible','bible-world','bible-power','bible-glossary','character-card'
  )),
  title TEXT NOT NULL,
  user_input TEXT DEFAULT '',
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'empty' CHECK (status IN ('empty','draft','generated','finalized')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('protagonist','antagonist','supporting')),
  archetype TEXT DEFAULT '',
  description TEXT DEFAULT '',
  motivation TEXT DEFAULT '',
  arc TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foreshadows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  planted_episode INTEGER,
  resolved_episode INTEGER,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS 활성화 ─────────────────────────────────────────────────────────────

ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreshadows ENABLE ROW LEVEL SECURITY;

-- ── 기존 정책 삭제 (재실행 시 충돌 방지) ──────────────────────────────────

DROP POLICY IF EXISTS "본인 프로젝트 조회" ON projects;
DROP POLICY IF EXISTS "본인 프로젝트 생성" ON projects;
DROP POLICY IF EXISTS "본인 프로젝트 수정" ON projects;
DROP POLICY IF EXISTS "본인 프로젝트 삭제" ON projects;

DROP POLICY IF EXISTS "본인 문서 조회" ON documents;
DROP POLICY IF EXISTS "본인 문서 생성" ON documents;
DROP POLICY IF EXISTS "본인 문서 수정" ON documents;
DROP POLICY IF EXISTS "본인 문서 삭제" ON documents;

DROP POLICY IF EXISTS "본인 캐릭터 전체" ON characters;
DROP POLICY IF EXISTS "본인 복선 전체" ON foreshadows;

-- ── RLS 정책 생성 ──────────────────────────────────────────────────────────

CREATE POLICY "본인 프로젝트 조회" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 프로젝트 생성" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 프로젝트 수정" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 프로젝트 삭제" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "본인 문서 조회" ON documents FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "본인 문서 생성" ON documents FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "본인 문서 수정" ON documents FOR UPDATE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "본인 문서 삭제" ON documents FOR DELETE
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "본인 캐릭터 전체" ON characters FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "본인 복선 전체" ON foreshadows FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ── updated_at 자동 갱신 트리거 ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP TRIGGER IF EXISTS documents_updated_at ON documents;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
