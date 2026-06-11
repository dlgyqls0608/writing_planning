-- NovelForge v2 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- 새 문서 타입(플롯 챕터, 바이블 섹션, 캐릭터 카드)을 위한 CHECK 제약 업데이트

-- ── documents.type CHECK 제약 교체 ────────────────────────────────────────

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'logline',
    'synopsis',
    'plot',
    'plot-chapter',
    'treatment',
    'story-bible',
    'bible-world',
    'bible-power',
    'bible-glossary',
    'character-card'
  ));
