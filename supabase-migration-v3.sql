-- NovelForge v3 마이그레이션
-- 버전 히스토리 기능: document_versions 테이블 추가
-- Supabase SQL Editor에서 실행하세요

-- ── document_versions 테이블 ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS document_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number  INTEGER     NOT NULL,
  content         TEXT        NOT NULL DEFAULT '',
  user_input      TEXT        NOT NULL DEFAULT '',
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 같은 문서 내 버전 번호 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS document_versions_doc_ver
  ON document_versions (document_id, version_number);

-- 최신 버전 조회 성능
CREATE INDEX IF NOT EXISTS document_versions_doc_saved
  ON document_versions (document_id, saved_at DESC);

-- ── RLS 활성화 ─────────────────────────────────────────────────────────────

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- ── 기존 정책 삭제 (재실행 시 충돌 방지) ──────────────────────────────────

DROP POLICY IF EXISTS "본인 버전 조회" ON document_versions;
DROP POLICY IF EXISTS "본인 버전 생성" ON document_versions;
DROP POLICY IF EXISTS "본인 버전 삭제" ON document_versions;

-- ── RLS 정책: 문서 소유자만 접근 ──────────────────────────────────────────

CREATE POLICY "본인 버전 조회" ON document_versions FOR SELECT
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON p.id = d.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "본인 버전 생성" ON document_versions FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON p.id = d.project_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "본인 버전 삭제" ON document_versions FOR DELETE
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON p.id = d.project_id
      WHERE p.user_id = auth.uid()
    )
  );
