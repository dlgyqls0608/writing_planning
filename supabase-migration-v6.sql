-- NovelForge v6 마이그레이션
-- 역할(role) CHECK 제약 조건 제거 — 조력자·엑스트라·직접 입력 역할 지원
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS characters_role_check;
