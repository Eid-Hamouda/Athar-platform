"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabaseServer";
import {
  buildMatchFingerprint,
  embedDonation,
  matchDonationsToNeed,
  matchNeedsToDonation,
  primeDonationEmbeddings,
  type EmbeddableDonation,
  type MatchVerdict,
  type ScoredMatch,
} from "@/services/aiMatchingService";
import type { DonationItem, NeedRequest } from "@/types";

/* -------------------------------------------------------------------------- */
/* Match cache                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Ranking a need costs an embedding pass plus a rerank — around seven seconds
 * of model time — and the answer only changes when the need or the catalogue
 * changes. So the scores are cached against a fingerprint of exactly those
 * inputs (see `buildMatchFingerprint`): revisiting the page is instant, while
 * publishing, reserving or editing any donation invalidates it immediately.
 *
 * Two tiers. The durable one is a `match_cache` column on the need, which the
 * beneficiary owns and may therefore write from their own session. The
 * process-local one covers the case where that column has not been added yet,
 * so the speed-up does not depend on the migration having been run.
 */
interface CachedMatchRun {
  key: string;
  at: string;
  matches: ScoredMatch[];
}

const memoryMatchCache = new Map<string, CachedMatchRun>();
const MEMORY_CACHE_LIMIT = 200;

/**
 * A safety net only — correctness comes from the fingerprint, not from age.
 * This exists so a ranking cannot outlive a change the fingerprint cannot see,
 * such as the hosted model being updated underneath us.
 */
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isFresh(entry: CachedMatchRun, fingerprint: string): boolean {
  if (entry.key !== fingerprint) return false;
  const age = Date.now() - new Date(entry.at).getTime();
  return Number.isFinite(age) && age >= 0 && age < CACHE_MAX_AGE_MS;
}

/**
 * Validates a cache entry read back from the database. The column is plain
 * jsonb that an older build — or a hand-written query — could have left in any
 * shape, so nothing is trusted without checking it.
 */
function parseCachedRun(value: unknown): CachedMatchRun | null {
  let raw = value;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (typeof raw !== "object" || raw === null) return null;

  const entry = raw as Partial<CachedMatchRun>;
  if (typeof entry.key !== "string") return null;
  if (typeof entry.at !== "string") return null;
  if (!Array.isArray(entry.matches)) return null;

  return { key: entry.key, at: entry.at, matches: entry.matches };
}

function readCachedRun(
  need: NeedRequest & { match_cache?: unknown },
  fingerprint: string
): ScoredMatch[] | null {
  // Read straight off the row the need was already fetched with, so the
  // durable tier costs no extra query.
  const stored = parseCachedRun(need.match_cache);
  if (stored && isFresh(stored, fingerprint)) return stored.matches;

  const inMemory = memoryMatchCache.get(need.id);
  if (inMemory && isFresh(inMemory, fingerprint)) return inMemory.matches;

  return null;
}

async function writeCachedRun(
  supabase: SupabaseClient,
  needId: string,
  entry: CachedMatchRun
) {
  if (memoryMatchCache.size >= MEMORY_CACHE_LIMIT) {
    const oldest = memoryMatchCache.keys().next().value;
    if (oldest !== undefined) memoryMatchCache.delete(oldest);
  }
  memoryMatchCache.set(needId, entry);

  // Best-effort: a missing column or a tightened policy costs speed, not
  // correctness, and must never turn a good ranking into a visible error.
  try {
    await supabase.from("needs").update({ match_cache: entry }).eq("id", needId);
  } catch {
    // Intentionally silent — the in-memory tier still applies.
  }
}

/** A donation joined with the reasoning behind its rank. */
export interface DonationMatch {
  donation: DonationItem;
  score: number;
  verdict: MatchVerdict;
  reasons: string[];
  concerns: string[];
  distanceKm: number | null;
  aiReranked: boolean;
}

/** One need together with everything ranked against it. */
export interface NeedMatchGroup {
  need: NeedRequest;
  matches: DonationMatch[];
  /** True when the reranker answered; the UI says so rather than implying it. */
  aiReranked: boolean;
}

export interface NeedMatchesResult {
  groups: NeedMatchGroup[];
  error?: string;
}

/**
 * The score a match must clear before it is pushed at someone. Measured on
 * this platform's data a genuinely matching need blends out around 80 and a
 * merely same-category one near 56, so this sits deliberately above the 65
 * used for suggestions the donor can simply ignore.
 */
const NOTIFY_MIN_SCORE = 72;

/**
 * A beneficiary with many open requests would otherwise fire one embedding
 * pass and one rerank per request, all at once, straight into the rate limit
 * that Gemini has already been returning. Three at a time keeps the page
 * responsive without stampeding.
 */
const MAX_NEEDS = 8;
const NEED_CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await run(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Ranks the available catalogue against every open request the caller has.
 *
 * Runs on the server because the Gemini key must never reach the browser, and
 * because scoring a whole catalogue client-side means shipping it there first.
 */
export async function findMatchesForNeedsAction(
  accessToken: string
): Promise<NeedMatchesResult> {
  if (!accessToken) {
    return { groups: [], error: "سجّل الدخول أولاً لعرض المطابقات الذكية." };
  }

  try {
    const supabase = createServerSupabase(accessToken);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { groups: [], error: "انتهت الجلسة. سجّل الدخول من جديد." };
    }

    // Issued together rather than in sequence: neither query depends on the
    // other, and on a cache hit these round trips are the whole response time.
    const [
      { data: needRows, error: needError },
      { data: donations, error: donationsError },
    ] = await Promise.all([
      // Needs are created as "pending" and stay so until they are covered.
      supabase
        .from("needs")
        .select("*")
        .eq("beneficiary_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(MAX_NEEDS),
      supabase.from("donations").select("*").eq("status", "available"),
    ]);

    if (needError) throw needError;
    if (donationsError) throw donationsError;

    const needs = (needRows ?? []) as NeedRequest[];
    if (needs.length === 0) return { groups: [] };

    const candidates = (donations ?? []) as EmbeddableDonation[];
    const byId = new Map(candidates.map((row) => [row.id, row]));

    // One shared embedding pass before the pool starts, so the concurrent runs
    // read the cache instead of each re-embedding the whole catalogue.
    const uncached = needs.some(
      (need) => !readCachedRun(need, buildMatchFingerprint(need, candidates))
    );
    if (uncached) await primeDonationEmbeddings(candidates);

    const groups = await mapWithConcurrency(needs, NEED_CONCURRENCY, async (need) => {
      const fingerprint = buildMatchFingerprint(need, candidates);
      const cached = readCachedRun(need, fingerprint);

      let scored: ScoredMatch[];
      let reranked: boolean;

      if (cached) {
        scored = cached;
        // Only fully reranked runs are ever stored, so a hit is a complete one.
        reranked = true;
      } else {
        const run = await matchDonationsToNeed(need, candidates);
        scored = run.matches;
        reranked = run.reranked;

        // A degraded ranking is deliberately not persisted: caching it would
        // keep serving the fallback ordering long after Gemini recovered.
        if (run.reranked) {
          void writeCachedRun(supabase, need.id, {
            key: fingerprint,
            at: new Date().toISOString(),
            matches: run.matches,
          });
        }
      }

      const matches: DonationMatch[] = [];
      for (const match of scored) {
        const donation = byId.get(match.id);
        if (!donation) continue;

        // The vector never leaves the server — it is noise to the client.
        const { embedding: _embedding, ...rest } = donation;
        void _embedding;

        matches.push({
          donation: rest as DonationItem,
          score: match.score,
          verdict: match.verdict,
          reasons: match.reasons,
          concerns: match.concerns,
          distanceKm: match.distanceKm,
          aiReranked: match.aiReranked,
        });
      }

      return { need, matches, aiReranked: reranked } satisfies NeedMatchGroup;
    });

    return { groups };
  } catch (error) {
    console.error("findMatchesForNeedsAction failed:", error);
    return { groups: [], error: "تعذّر جلب المطابقات. حاول مرة أخرى." };
  }
}

export interface NeedSuggestion {
  need: NeedRequest;
  score: number;
}
/**
 * No distance is returned here. Suggestions are requested as soon as the photo
 * is classified, which is usually before the donor has picked a pickup point,
 * so any distance computed server-side would be null far more often than not.
 * The form has the need's delivery point already and computes it from live
 * state instead, which also keeps it correct while the map pin is moved.
 */

/**
 * The reverse direction: open needs this item would satisfy. Called right after
 * the vision model describes a donor's photo, while they are still on the form.
 */
export async function findNeedsForDonationAction(
  accessToken: string,
  draft: Pick<
    DonationItem,
    "title" | "category" | "sub_category" | "condition" | "description" | "location"
  >
): Promise<NeedSuggestion[]> {
  if (!accessToken) return [];

  try {
    const supabase = createServerSupabase(accessToken);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: needs, error } = await supabase
      .from("needs")
      .select("*")
      .eq("status", "pending");

    if (error) throw error;

    const open = ((needs ?? []) as NeedRequest[]).filter(
      (need) => (need.quantity ?? 1) > 0
    );

    const scored = await matchNeedsToDonation(draft, open);
    const byId = new Map(open.map((need) => [need.id, need]));

    return scored.flatMap((match) => {
      const need = byId.get(match.id);
      if (!need) return [];
      return [{ need, score: match.score }];
    });
  } catch (error) {
    console.error("findNeedsForDonationAction failed:", error);
    return [];
  }
}

/**
 * Embeds a freshly created donation so later matches skip the API entirely.
 * The caller persists the result itself: the donor owns that row, so the write
 * passes row-level security in their session and not in a server-side one.
 */
export async function embedDonationAction(
  draft: Pick<
    DonationItem,
    "title" | "category" | "sub_category" | "condition" | "description"
  >
): Promise<number[] | null> {
  try {
    return await embedDonation(draft);
  } catch (error) {
    console.error("embedDonationAction failed:", error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Match notifications                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Alerts beneficiaries whose open request this newly published donation would
 * satisfy — the other half of the empty state on the matches page, where a
 * request that found nothing simply stays open.
 *
 * Fire-and-forget from the donor's session: it must never delay or fail their
 * upload. The write goes through the `notify_matching_needs` function rather
 * than a direct insert, because the rows belong to other people — see
 * supabase/migrations/0003_match_notifications.sql.
 */
export async function notifyMatchingNeedsAction(
  accessToken: string,
  donationId: string,
  draft: Pick<
    DonationItem,
    "title" | "category" | "sub_category" | "condition" | "description" | "location"
  >
): Promise<number> {
  if (!accessToken || !donationId) return 0;

  try {
    const supabase = createServerSupabase(accessToken);

    const { data: needs, error } = await supabase
      .from("needs")
      .select("*")
      .eq("status", "pending");

    if (error) throw error;

    const open = ((needs ?? []) as NeedRequest[]).filter(
      (need) => (need.quantity ?? 1) > 0
    );
    if (open.length === 0) return 0;

    // Stricter than the on-screen suggestions and capped well below the
    // function's own ceiling: this reaches a stranger's inbox unprompted, so
    // the bar is "this clearly solves their problem", not "this is related".
    const matched = await matchNeedsToDonation(draft, open, 5, NOTIFY_MIN_SCORE);
    if (matched.length === 0) return 0;

    const { data: inserted, error: rpcError } = await supabase.rpc(
      "notify_matching_needs",
      {
        p_donation_id: donationId,
        p_need_ids: matched.map((match) => match.id),
        p_scores: matched.map((match) => match.score),
      }
    );

    if (rpcError) throw rpcError;
    return typeof inserted === "number" ? inserted : 0;
  } catch (error) {
    // Never surfaced to the donor: their donation is already published.
    console.error("notifyMatchingNeedsAction failed:", error);
    return 0;
  }
}
