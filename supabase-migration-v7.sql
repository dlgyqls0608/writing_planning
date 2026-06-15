-- NovelForge v7 마이그레이션
-- story_context: AI 생성 시 일관성 유지를 위한 3-필드 압축 컨텍스트
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS story_context JSONB DEFAULT '{"core":"","active":"","upcoming":""}';
