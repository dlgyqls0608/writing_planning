-- NovelForge v5 마이그레이션
-- 캐릭터 메모 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS memo TEXT NOT NULL DEFAULT '';
