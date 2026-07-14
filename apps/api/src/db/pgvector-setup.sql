-- pgvector Extension Setup
-- ─────────────────────────────────────────────────────────────────────────────
-- This script MUST be run manually once against your Supabase database before
-- any tables with `vector(n)` columns are created or migrated.
--
-- Run it in one of the following ways:
--   1. Supabase Dashboard → SQL Editor → paste and execute
--   2. Via psql: psql "$DATABASE_URL" -f apps/api/src/db/pgvector-setup.sql
--   3. Include in the first Drizzle migration (Task 2.3) using `sql.raw()`
--
-- Without this extension, creating `resource_chunks.embedding vector(768)`
-- and the HNSW index used for semantic search (Task 9.1) will fail.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable the pgvector extension (idempotent — safe to re-run).
CREATE EXTENSION IF NOT EXISTS vector;
