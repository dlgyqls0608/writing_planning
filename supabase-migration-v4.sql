-- NovelForge v4 마이그레이션
-- 캐릭터 사망 상태 추가: is_deceased 컬럼
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN NOT NULL DEFAULT FALSE;
