-- Smart matching: durable storage for embeddings and cached rankings.
--
-- Run this once in the Supabase SQL editor. Both columns are optional — the
-- matching engine works without them, falling back to embedding on demand and
-- to a process-local cache. What they buy is durability: results survive a
-- restart, and on serverless they are shared across instances instead of being
-- recomputed by each one.

-- ---------------------------------------------------------------------------
-- 1. Donation embeddings
-- ---------------------------------------------------------------------------
-- Written once by the donor when the donation is created, then reused by every
-- later search. Nullable: rows without one are embedded on demand.
--
-- jsonb rather than pgvector: similarity is computed in TypeScript over a
-- shortlist, so no vector index is needed and this runs on any Postgres with
-- no extension enabled. Swap in `vector(768)` plus an ivfflat index once the
-- catalogue is large enough for the database to do the search itself.

alter table public.donations
  add column if not exists embedding jsonb;

comment on column public.donations.embedding is
  'gemini-embedding-001 vector (768 dims) of the donation text, written at creation by the donor.';

-- ---------------------------------------------------------------------------
-- 2. Cached rankings
-- ---------------------------------------------------------------------------
-- Shape: { "key": "<fingerprint>", "at": "<iso timestamp>", "matches": [...] }
--
-- `key` fingerprints the need plus the exact candidate set, so publishing,
-- reserving or editing any donation invalidates the entry on its own. Only
-- fully reranked runs are stored — a ranking produced while the model was
-- unavailable is never cached.

alter table public.needs
  add column if not exists match_cache jsonb;

comment on column public.needs.match_cache is
  'Cached smart-matching result for this need, keyed by a fingerprint of the need and the candidate set. Safe to delete at any time; it is rebuilt on the next visit.';

-- ---------------------------------------------------------------------------
-- 3. Policy check
-- ---------------------------------------------------------------------------
-- Donors already update their own donations and beneficiaries their own needs,
-- so no new policy should be required. Confirm the existing UPDATE policies
-- cover these columns:
--
--   select policyname, cmd, qual from pg_policies
--   where schemaname = 'public' and tablename in ('donations', 'needs');
