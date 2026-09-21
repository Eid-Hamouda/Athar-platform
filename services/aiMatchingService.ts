import { createHash } from "node:crypto";

import { Type } from "@google/genai";

import type { DonationItem, NeedRequest } from "@/types";
import { distanceBetween } from "@/lib/geo";
import { ai, generateWithFallback } from "@/services/geminiClient";
import {
  isUsableArabic,
  rerankWithFallbackProvider,
} from "@/services/fallbackProvider";

/**
 * Smart matching engine.
 *
 * Three stages, each doing only what it is actually good at:
 *
 *   1. RECALL      embeddings put a need and a donation near each other when
 *                  they mean the same thing, even when the classifier worded
 *                  them differently ("أغطية" vs "مفروشات شتوية"). Substring
 *                  matching cannot do this, and since categories are generated
 *                  freely rather than picked from a fixed list, near-misses in
 *                  wording are the common case rather than the exception.
 *   2. PRECISION   one Gemini call reranks the shortlist, reading the free-text
 *                  descriptions and reporting concerns as well as reasons.
 *   3. LOGISTICS   distance and condition, computed here in TypeScript so the
 *                  number is stable across reloads and auditable.
 *
 * Every stage degrades on its own: no reranker falls back to embedding order,
 * no embeddings falls back to lexical overlap. The caller always gets a list.
 */

const EMBEDDING_MODEL = "gemini-embedding-001";

/** Trimmed from the default 3072 — cheaper to store and ship, same ordering. */
const EMBEDDING_DIMENSIONS = 768;

/** How many embedding hits get the expensive reranking pass. */
const SHORTLIST_SIZE = 25;

/**
 * The minimum relevance a candidate must show before it is worth either a
 * rerank call or a place in the results. On the measured scale an unrelated
 * item lands at 0 and a same-category-but-wrong one around 30.
 */
const RERANK_FLOOR = 15;

/** Below this blended score a candidate is noise, not a suggestion. */
const MIN_SCORE = 25;

/**
 * Hard ceilings on how long a beneficiary waits. These exist because a Gemini
 * request can hang rather than fail — one observed call sat open for five
 * minutes before the socket timed out, which would look to the user like a
 * broken page. Past the deadline the pipeline degrades instead of waiting.
 */
const EMBEDDING_TIMEOUT_MS = 15_000;
const RERANK_TIMEOUT_MS = 25_000;

/**
 * Bumped whenever the prompt, the weights or the scoring scale change. It is
 * part of every cache key, so raising it retires every stored ranking at once
 * — otherwise an improvement to the engine would be invisible to anyone whose
 * results were already cached.
 */
const MATCH_ENGINE_VERSION = "1";

/**
 * Identifies one exact matching problem: this need, against this set of
 * candidates, under this version of the engine.
 *
 * Content-based rather than time-based, so the cache is invalidated by the
 * things that actually change the answer — a donation published, reserved,
 * edited or moved — instead of expiring on a timer while still correct.
 */
export function buildMatchFingerprint(
  need: NeedRequest,
  donations: DonationItem[]
): string {
  const hash = createHash("sha1");

  hash.update(MATCH_ENGINE_VERSION);
  hash.update(`\0${needToText(need)}`);
  // Urgency reweights proximity and the delivery point sets every distance, so
  // both change the ranking even when the wording of the need does not.
  hash.update(`\0${need.urgency ?? ""}`);
  hash.update(`\0${need.quantity ?? ""}`);
  hash.update(`\0${need.delivery_location ?? ""}`);

  // Sorted so that the order rows come back from Postgres cannot change the key.
  for (const donation of [...donations].sort((a, b) => a.id.localeCompare(b.id))) {
    hash.update(`\0${donation.id}`);
    hash.update(`\0${donationToText(donation)}`);
    hash.update(`\0${donation.location ?? ""}`);
  }

  return hash.digest("hex");
}

export type MatchVerdict =
  | "مطابق تماماً"
  | "مناسب"
  | "بديل محتمل"
  | "غير مناسب";

export interface ScoredMatch {
  id: string;
  score: number;
  verdict: MatchVerdict;
  reasons: string[];
  concerns: string[];
  distanceKm: number | null;
  /** False when the reranker was unavailable and scoring is similarity-only. */
  aiReranked: boolean;
}

/* -------------------------------------------------------------------------- */
/* Text representations                                                        */
/* -------------------------------------------------------------------------- */

const joinFields = (parts: (string | null | undefined)[]) =>
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" — ");

export function donationToText(donation: Partial<DonationItem>): string {
  return joinFields([
    donation.title,
    donation.category,
    donation.sub_category,
    donation.condition ? `الحالة: ${donation.condition}` : null,
    donation.description,
  ]);
}

export function needToText(need: Partial<NeedRequest>): string {
  return joinFields([
    need.title,
    need.category,
    need.sub_category,
    need.description,
  ]);
}

/* -------------------------------------------------------------------------- */
/* Stage 1 — embeddings                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Gemini answers 503 ("high demand") and 429 often enough that a single-shot
 * call would drop the beneficiary to the fallback ranking for a hiccup that
 * clears in under a second. One retry, then give up and degrade.
 */
async function withRetry<T>(
  label: string,
  run: () => Promise<T>
): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const retryable = status === 503 || status === 429 || status === 500;

      if (!retryable || attempt === 1) {
        console.error(`${label} failed:`, error);
        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return null;
}

/**
 * Embeddings are deterministic for a given text, so they are cached by content
 * rather than by row id: an edited donation re-embeds, an untouched one never
 * does. Process-local, which is enough to collapse the repeat calls a single
 * page session makes; the durable cache is the `embedding` column.
 */
const embeddingCache = new Map<string, number[]>();
const EMBEDDING_CACHE_LIMIT = 500;

function cacheEmbedding(text: string, vector: number[]) {
  if (embeddingCache.size >= EMBEDDING_CACHE_LIMIT) {
    // Cheap FIFO eviction — a Map iterates in insertion order.
    const oldest = embeddingCache.keys().next().value;
    if (oldest !== undefined) embeddingCache.delete(oldest);
  }
  embeddingCache.set(text, vector);
}

async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  // Only texts that are neither empty nor already cached reach the API. The
  // task type is part of the key: the same sentence embeds to a different
  // vector as a query than as a document, so keying on text alone would hand
  // back the wrong one.
  const pending: { index: number; text: string }[] = [];
  texts.forEach((text, index) => {
    if (!text) return;
    const cached = embeddingCache.get(`${taskType}:${text}`);
    if (cached) {
      results[index] = cached;
      return;
    }
    pending.push({ index, text });
  });

  if (pending.length === 0) return results;

  // One deadline shared by both attempts, so a retry cannot double the wait.
  const deadline = AbortSignal.timeout(EMBEDDING_TIMEOUT_MS);

  const response = await withRetry("Embedding request", () =>
    ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: pending.map((entry) => entry.text),
      config: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
        abortSignal: deadline,
      },
    })
  );

  response?.embeddings?.forEach((embedding, position) => {
    const vector = embedding.values;
    const entry = pending[position];
    if (!vector || !entry) return;
    results[entry.index] = vector;
    cacheEmbedding(`${taskType}:${entry.text}`, vector);
  });

  return results;
}

/** Embeds one donation so it can be stored and reused across sessions. */
export async function embedDonation(
  donation: Partial<DonationItem>
): Promise<number[] | null> {
  const text = donationToText(donation);
  if (!text) return null;
  const [vector] = await embedTexts([text], "RETRIEVAL_DOCUMENT");
  return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Last-resort ordering when the embedding API is unreachable: words shared
 * between the two texts. Weak, but it keeps the page useful during an outage.
 */
function lexicalSimilarity(a: string, b: string): number {
  const tokenise = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .split(/[\s—,،.:؛/\\()-]+/)
        .filter((token) => token.length > 1)
    );

  const left = tokenise(a);
  const right = tokenise(b);
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;

  return shared / Math.sqrt(left.size * right.size);
}

/* -------------------------------------------------------------------------- */
/* Stage 3 — logistics (deterministic)                                         */
/* -------------------------------------------------------------------------- */

const CONDITION_SCORE: Record<string, number> = {
  ممتازة: 100,
  "جيدة جداً": 78,
  مقبولة: 55,
};

/**
 * How much distance should weigh against item quality. A critical need is
 * about getting something workable there quickly, so proximity dominates; an
 * ordinary need can afford to wait for the better item further away.
 */
const PROXIMITY_WEIGHT: Record<string, number> = {
  "حرج طارئ": 0.75,
  عاجل: 0.6,
  عادي: 0.45,
};

function proximityScore(km: number | null): number {
  if (km === null) return 50; // Unknown location — neither rewarded nor punished.
  if (km <= 3) return 100;
  return Math.max(5, 100 * Math.exp(-(km - 3) / 45));
}

function logisticsScore(
  need: Pick<NeedRequest, "urgency" | "delivery_location">,
  donation: Pick<DonationItem, "condition" | "location">,
  distanceKm: number | null
): number {
  const weight = PROXIMITY_WEIGHT[need.urgency ?? ""] ?? 0.45;
  const condition = CONDITION_SCORE[donation.condition ?? ""] ?? 65;

  return weight * proximityScore(distanceKm) + (1 - weight) * condition;
}

/**
 * Cosine scores from this model sit in a narrow, high band — measured against
 * this platform's own data, an exact match lands around 0.75-0.79 while a
 * completely unrelated item still scores 0.53-0.58. Handing those numbers to a
 * beneficiary unscaled would advertise a plate of salad as a 53% match for
 * children's clothing, so the dead bottom of the band is mapped to zero.
 *
 * Only the fallback path and the donor-side suggestions read these numbers; a
 * successful rerank replaces them with the model's own judgement.
 */
const SIMILARITY_FLOOR = 0.55;
const SIMILARITY_SPAN = 0.25;

function similarityToRelevance(similarity: number): number {
  const scaled = ((similarity - SIMILARITY_FLOOR) / SIMILARITY_SPAN) * 100;
  return Math.max(0, Math.min(100, scaled));
}

/* -------------------------------------------------------------------------- */
/* Stage 2 — reranking                                                         */
/* -------------------------------------------------------------------------- */

interface RerankVerdict {
  index: number;
  score: number;
  verdict: MatchVerdict;
  reasons: string[];
  concerns: string[];
}

const RERANK_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      index: {
        type: Type.INTEGER,
        description: "The candidate's رقم exactly as given in the input list",
      },
      score: {
        type: Type.INTEGER,
        description:
          "0-100 — how well this item satisfies the stated need. Use the full range; reserve 90+ for items that genuinely solve the need.",
      },
      verdict: {
        type: Type.STRING,
        enum: ["مطابق تماماً", "مناسب", "بديل محتمل", "غير مناسب"],
      },
      reasons: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "1-3 short Arabic phrases citing concrete facts from the item's own fields. No generic praise.",
      },
      concerns: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "0-2 short Arabic phrases naming a real reservation (size, condition, suitability). Empty array when there is none.",
      },
    },
    required: ["index", "score", "verdict", "reasons", "concerns"],
  },
};

async function rerankCandidates(
  need: NeedRequest,
  candidates: DonationItem[]
): Promise<Map<number, RerankVerdict> | null> {
  if (candidates.length === 0) return null;

  const needBlock = joinFields([
    `العنوان: ${need.title}`,
    `الفئة: ${need.category}`,
    need.sub_category ? `التصنيف الفرعي: ${need.sub_category}` : null,
    `الأولوية: ${need.urgency}`,
    need.quantity ? `الكمية المطلوبة: ${need.quantity}` : null,
    need.description ? `التفاصيل: ${need.description}` : null,
  ]);

  const candidateBlock = candidates
    .map((candidate, index) =>
      joinFields([
        `رقم ${index}`,
        `العنوان: ${candidate.title}`,
        `الفئة: ${candidate.category}`,
        candidate.sub_category
          ? `التصنيف الفرعي: ${candidate.sub_category}`
          : null,
        candidate.condition ? `الحالة: ${candidate.condition}` : null,
        candidate.description ? `الوصف: ${candidate.description}` : null,
      ])
    )
    .join("\n");

  const prompt = [
    "أنت مسؤول المطابقة في منصة تبرعات عينية. لديك طلب احتياج واحد وقائمة قطع متبرَّع بها.",
    "قيّم كل قطعة بحسب مدى تلبيتها لهذا الطلب تحديداً.",
    "",
    "الطلب:",
    needBlock,
    "",
    "القطع المتاحة:",
    candidateBlock,
    "",
    "قواعد التقييم:",
    "- اقرأ الوصف الحر، لا الفئة وحدها. الفئات مكتوبة بصياغة حرة وقد تختلف تسميتها للشيء نفسه، فاعتمد على المعنى لا على تطابق الحروف.",
    "- القطعة التي تحل الاحتياج فعلياً تستحق درجة عالية حتى لو اختلفت تسمية فئتها عن تسمية الطلب.",
    "- القطعة التي تشترك في الفئة لكنها لا تناسب الاحتياج المذكور تستحق درجة منخفضة.",
    "- اذكر في reasons حقائق من بيانات القطعة نفسها، لا عبارات عامة.",
    "- اذكر في concerns أي تحفّظ حقيقي (مقاس، حالة، ملاءمة للفئة العمرية). اتركها فارغة إن لم يوجد تحفّظ.",
    "- أعد عنصراً واحداً لكل قطعة، مع رقمها كما ورد.",
  ].join("\n");

  const response = await generateWithFallback({
    label: "Rerank request",
    timeoutMs: RERANK_TIMEOUT_MS,
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: RERANK_SCHEMA,
    },
  });

  // Gemini is metered per model per day and matching is what drains it, so a
  // second provider is tried before giving up on reranking altogether. Without
  // this the page drops to embedding-only ordering for the rest of the day.
  if (!response?.text) {
    const fallback = await rerankWithFallbackProvider(prompt, candidates.length);
    if (!fallback) return null;

    const verdicts = new Map<number, RerankVerdict>();
    for (const entry of fallback) {
      verdicts.set(entry.index, {
        index: entry.index,
        score: entry.score,
        verdict: entry.verdict as MatchVerdict,
        reasons: entry.reasons,
        concerns: entry.concerns,
      });
    }
    return verdicts.size > 0 ? verdicts : null;
  }

  try {
    const parsed = JSON.parse(response.text) as RerankVerdict[];
    if (!Array.isArray(parsed)) return null;

    const verdicts = new Map<number, RerankVerdict>();
    for (const entry of parsed) {
      // The index is model-produced, so it is treated as untrusted input.
      if (!Number.isInteger(entry?.index)) continue;
      if (entry.index < 0 || entry.index >= candidates.length) continue;

      verdicts.set(entry.index, {
        ...entry,
        score: Math.max(0, Math.min(100, Number(entry.score) || 0)),
        // Same language filter as the fallback path: a garbled line is dropped
        // while the score it came with is kept, so one bad sentence never
        // costs an otherwise good match its rank.
        reasons: (Array.isArray(entry.reasons) ? entry.reasons : [])
          .filter(isUsableArabic)
          .slice(0, 3),
        concerns: (Array.isArray(entry.concerns) ? entry.concerns : [])
          .filter(isUsableArabic)
          .slice(0, 2),
      });
    }

    return verdicts.size > 0 ? verdicts : null;
  } catch (error) {
    console.error("Rerank response was not usable JSON:", error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Pipeline                                                                    */
/* -------------------------------------------------------------------------- */

/** A donation row that may carry a persisted embedding from the database. */
export type EmbeddableDonation = DonationItem & {
  embedding?: number[] | string | null;
};

function readStoredEmbedding(donation: EmbeddableDonation): number[] | null {
  const stored = donation.embedding;
  if (Array.isArray(stored) && stored.length > 0) return stored;

  // A jsonb column can come back as a string depending on the column type.
  if (typeof stored === "string") {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      return null;
    }
  }

  return null;
}

export interface MatchRun {
  matches: ScoredMatch[];
  /**
   * Whether the reranker actually answered. Callers use this to decide both
   * what to tell the user and whether the result is worth caching: a ranking
   * produced while Gemini was unavailable must not be stored, or it would
   * outlive the outage that caused it.
   */
  reranked: boolean;
}

/**
 * Embeds every donation that has no stored vector, filling the process cache.
 *
 * Matching several needs at once would otherwise have each concurrent run
 * embed the whole catalogue independently — they start before any of them has
 * populated the cache. Doing it once up front collapses that to a single pass.
 */
export async function primeDonationEmbeddings(
  donations: EmbeddableDonation[]
): Promise<void> {
  const texts = donations
    .filter((donation) => readStoredEmbedding(donation) === null)
    .map(donationToText)
    .filter(Boolean);

  if (texts.length === 0) return;
  await embedTexts(texts, "RETRIEVAL_DOCUMENT");
}

/**
 * Ranks `donations` against `need`. Returns at most `limit` matches, ordered
 * best-first, with the sub-scores already blended.
 */
export async function matchDonationsToNeed(
  need: NeedRequest,
  donations: EmbeddableDonation[],
  limit = 12
): Promise<MatchRun> {
  if (donations.length === 0) return { matches: [], reranked: true };

  const needText = needToText(need);
  const donationTexts = donations.map(donationToText);

  /* --- Stage 1: recall -------------------------------------------------- */

  // Rows that already carry an embedding cost nothing; only the rest are sent.
  const vectors = donations.map(readStoredEmbedding);
  const missing = donations
    .map((_, index) => index)
    .filter((index) => vectors[index] === null);

  const [needVector, computed] = await Promise.all([
    embedTexts([needText], "RETRIEVAL_QUERY").then(([vector]) => vector),
    missing.length > 0
      ? embedTexts(
          missing.map((index) => donationTexts[index]),
          "RETRIEVAL_DOCUMENT"
        )
      : Promise.resolve<(number[] | null)[]>([]),
  ]);

  missing.forEach((donationIndex, position) => {
    vectors[donationIndex] = computed[position] ?? null;
  });

  // Whether stage 1 actually ran. When the embedding API is unreachable the
  // ordering below is lexical word overlap, which lives on a completely
  // different scale from cosine — so everything calibrated against cosine has
  // to know not to trust it.
  const embeddingsAvailable =
    needVector !== null && vectors.some((vector) => vector !== null);

  const similarities = donations.map((_, index) => {
    const vector = vectors[index];
    if (needVector && vector) return cosineSimilarity(needVector, vector);
    return lexicalSimilarity(needText, donationTexts[index]);
  });

  const shortlist = donations
    .map((donation, index) => ({ donation, similarity: similarities[index] }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, SHORTLIST_SIZE);

  /* --- Stage 2: precision ----------------------------------------------- */

  // Reranking is the scarce resource — the free Gemini tier allows only 20
  // generateContent calls per day per model, against effectively unlimited
  // embedding calls. So when stage 1 says nothing in the catalogue is even
  // plausibly related, the call is skipped rather than spent confirming it:
  // a need with no plausible match is exactly the case that ends in a "we
  // will tell you when something arrives" empty state anyway.
  //
  // That shortcut is only safe while the scores come from embeddings. With the
  // embedding API down these are lexical overlap scores, which are far lower
  // for the same pair, and reading them on the cosine scale would skip the
  // rerank on every need — silently emptying the page during an outage. Losing
  // stage 1 is precisely when stage 2 is most worth spending.
  const worthReranking =
    !embeddingsAvailable ||
    shortlist.some(
      (entry) => similarityToRelevance(entry.similarity) >= RERANK_FLOOR
    );

  const verdicts = worthReranking
    ? await rerankCandidates(
        need,
        shortlist.map((entry) => entry.donation)
      )
    : null;

  /* --- Stage 3: logistics and blending ---------------------------------- */

  const matches = shortlist.map(({ donation, similarity }, index) => {
    const verdict = verdicts?.get(index) ?? null;

    const distanceKm = distanceBetween(
      donation.location,
      need.delivery_location
    );
    const logistics = logisticsScore(need, donation, distanceKm);
    // Without a verdict the only relevance signal is stage 1, and its scale is
    // only meaningful when it came from embeddings. Lexical overlap is scored
    // as zero rather than converted, so a match is never recommended on the
    // strength of a shared word plus a short drive.
    const relevance = verdict
      ? verdict.score
      : embeddingsAvailable
        ? similarityToRelevance(similarity)
        : 0;

    const score = Math.round(0.7 * relevance + 0.3 * logistics);

    return {
      match: {
        id: donation.id,
        score,
        verdict:
          verdict?.verdict ??
          ((score >= 60 ? "مناسب" : "بديل محتمل") satisfies MatchVerdict),
        reasons: verdict?.reasons ?? [],
        concerns: verdict?.concerns ?? [],
        distanceKm,
        aiReranked: Boolean(verdict),
      } satisfies ScoredMatch,
      relevance,
    };
  });

  return {
    matches: matches
      .filter(({ match, relevance }) => {
        // Relevance is a gate, not just a term in the sum. Logistics alone can
        // otherwise push something unrelated over the line: an item scoring
        // zero on the need itself still collects ~30 points for being pristine
        // and nearby, which is enough to clear MIN_SCORE and be recommended.
        if (relevance < RERANK_FLOOR) return false;
        return match.score >= MIN_SCORE && match.verdict !== "غير مناسب";
      })
      .map(({ match }) => match)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit),
    // A skipped rerank is a complete answer, not a degraded one: stage 1 found
    // nothing worth a second opinion. Only an attempted-and-failed rerank
    // should warn the user or suppress caching.
    reranked: !worthReranking || verdicts !== null,
  };
}

/**
 * The same engine read in the opposite direction: which open needs would this
 * item satisfy? Used at donation time, when the donor's intent is highest.
 *
 * Embeddings only — this runs while the donor waits on a form, and a shortlist
 * of three needs does not justify a second round-trip to the reranker.
 */
export async function matchNeedsToDonation(
  donation: Partial<DonationItem>,
  needs: NeedRequest[],
  limit = 3,
  /**
   * Raised by callers that push rather than display. An on-screen suggestion
   * the donor can ignore is cheap; an alert sent to a stranger is not, so
   * notifications ask for a higher bar than this default.
   */
  minScore = 65
): Promise<ScoredMatch[]> {
  if (needs.length === 0) return [];

  const donationText = donationToText(donation);
  if (!donationText) return [];

  const needTexts = needs.map(needToText);

  // The item is the query and the needs are the documents. Pairing the two task
  // types is measurably sharper than embedding both sides the same way: it
  // widens the gap between the right need and a merely same-category one.
  const [[donationVector], needVectors] = await Promise.all([
    embedTexts([donationText], "RETRIEVAL_QUERY"),
    embedTexts(needTexts, "RETRIEVAL_DOCUMENT"),
  ]);

  const scored = needs.map((need, index) => {
    const needVector = needVectors[index];
    const similarity =
      donationVector && needVector
        ? cosineSimilarity(donationVector, needVector)
        : lexicalSimilarity(donationText, needTexts[index]);

    const distanceKm = distanceBetween(
      donation.location,
      need.delivery_location
    );

    const logistics = logisticsScore(
      need,
      donation as Pick<DonationItem, "condition" | "location">,
      distanceKm
    );

    return {
      id: need.id,
      score: Math.round(0.7 * similarityToRelevance(similarity) + 0.3 * logistics),
      verdict: "مناسب" as MatchVerdict,
      reasons: [],
      concerns: [],
      distanceKm,
      aiReranked: false,
    } satisfies ScoredMatch;
  });

  // Higher bar than the beneficiary side: this is an unprompted interruption on
  // a form the donor is already filling in, so a weak guess is worse than
  // silence. On the measured scale a genuinely matching need clears ~75, while
  // a merely same-category one lands near 55.
  return scored
    .filter((match) => match.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
