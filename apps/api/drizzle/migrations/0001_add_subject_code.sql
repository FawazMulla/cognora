-- Add subject code column for storing subject codes like AIDS-701, IOE-702, etc.
ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "code" text;
