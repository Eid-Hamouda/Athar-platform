import type { AIAnalysisResult } from "@/services/aiVisionService";

/**
 * A second vision provider, used only when every Gemini model has refused.
 *
 * Reached through OpenRouter's OpenAI-compatible endpoint, so the same adapter
 * serves Groq, Mistral, Together, Cerebras or OpenAI itself: adding one is a
 * matter of a base URL and a key, not new code. Each provider is a separate
 * free allowance, which is the whole point — Gemini meters per model per day,
 * and a second provider is a pool that meter cannot drain.
 *
 * Dormant without a key. No key, no request, no change in behaviour.
 */

interface Provider {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  /**
   * In preference order, and separate per task: a model that reads an image
   * well is not necessarily one that judges a match well, and the two were
   * measured independently. See `isUsableArabic` for why these lists are short.
   */
  visionModels: string[];
  textModels: string[];
}

const list = (value: string | undefined, fallback: string) =>
  (value ?? fallback)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

function providers(task: "vision" | "text"): Provider[] {
  const all: Provider[] = [
    {
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      // Two entries because the guard below makes an unreliable model cheap to
      // try: a garbled answer is rejected in microseconds and the next one runs.
      // `nex-n2.5-pro` leads because it was the only model that stayed clean
      // across repeated runs; `dots-3` is fast but produced language-mixed text
      // in two runs out of three, so it is a second chance, not a first choice.
      visionModels: list(
        process.env.OPENROUTER_VISION_MODELS,
        "nex-agi/nex-n2.5-pro:free,dots-studio/dots-3-note-preview:free"
      ),
      // Ranked by measured judgement on the real reranking task: each was asked
      // to score a child's garment, an adult coat and a plate of food against a
      // children's-clothing need. Nemotron led on both accuracy and speed.
      // `liquid/lfm-2.5-2.6b` is deliberately absent — it ranked correctly but
      // misstated the item's condition, and a matcher that invents facts about
      // a donation is worse than one that is simply unavailable.
      textModels: list(
        process.env.OPENROUTER_TEXT_MODELS,
        "nvidia/nemotron-3-super-120b-a12b:free,nex-agi/nex-n2.5-pro:free,nex-agi/nex-n2.5-mini:free"
      ),
    },
    // Same shape, different pool. Set GROQ_API_KEY plus either model list to
    // enable; it is OpenAI-compatible, so nothing else needs to change.
    {
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      visionModels: list(process.env.GROQ_VISION_MODELS, ""),
      textModels: list(process.env.GROQ_TEXT_MODELS, ""),
    },
    // Last on purpose. OpenAI has no free tier, so it is the only entry here
    // that can cost money — it should be reached only once every free option
    // has failed. Quality would justify placing it first; the bill would not.
    // Reorder through the env vars if that trade ever changes.
    {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
      visionModels: list(process.env.OPENAI_VISION_MODELS, "gpt-4.1-mini"),
      textModels: list(process.env.OPENAI_TEXT_MODELS, "gpt-4.1-mini"),
    },
  ];

  return all.filter(
    (provider) =>
      provider.apiKey &&
      (task === "vision" ? provider.visionModels : provider.textModels).length >
        0
  );
}

/**
 * Measured latency on the free tier for the default model: 1.5s, 2.5s, 3.2s,
 * 26s, and three outright stalls. A fast median with a very long tail, so the
 * ceiling is set to catch the healthy case and abandon the congested one
 * quickly — this runs after Gemini has already spent up to 20s, and a donor is
 * watching a spinner the whole time.
 */
const FALLBACK_TIMEOUT_MS = 20_000;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string" },
    sub_category: { type: "string" },
    condition: { type: "string", enum: ["ممتازة", "جيدة جداً", "مقبولة"] },
    suggested_title: { type: "string" },
    suggested_description: { type: "string" },
  },
  required: [
    "category",
    "sub_category",
    "condition",
    "suggested_title",
    "suggested_description",
  ],
  additionalProperties: false,
} as const;

const CONDITIONS = ["ممتازة", "جيدة جداً", "مقبولة"];

/* -------------------------------------------------------------------------- */
/* Output quality                                                             */
/* -------------------------------------------------------------------------- */

// Han, Hiragana, Katakana, Hangul. Nothing here has any business appearing in
// a description of a donated coat.
const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯]/;
const ARABIC_LETTER = /[؀-ۿݐ-ݿ]/;

/**
 * Rejects the language-mixed gibberish that free models intermittently emit.
 *
 * This is not hypothetical. Testing these models on a real donation photo
 * produced, in Arabic fields, output like "بزippers مائلة", "Bolsos بسحابات",
 * "ال_mlابس" and "عيوب或 آثار" — a Spanish word, a spliced English one, a
 * template artefact and a Chinese character. One model was clean on its first
 * call and corrupted on the next two, so this cannot be settled by choosing a
 * model; it has to be checked per response.
 *
 * It matters because this text is not decoration: it is saved as the donation
 * description and shown to beneficiaries deciding whether to accept a delivery.
 * A schema-valid response is not necessarily a publishable one.
 */
export function isUsableArabic(value: string): boolean {
  if (!value) return false;

  // No legitimate reason for CJK in Arabic donation copy.
  if (CJK.test(value)) return false;

  // Seen verbatim in corrupted output from more than one model.
  if (value.includes("_ml_")) return false;

  if (!ARABIC_LETTER.test(value)) return false;

  // Latin spliced directly onto an Arabic word — "مkeleyة", "بزippers" — with
  // no separator between the scripts. Always corruption, never intentional.
  if (/[؀-ۿ][A-Za-z]|[A-Za-z][؀-ۿ]/.test(value)) {
    return false;
  }

  // Standalone Latin runs are judged on shape rather than on how many there
  // are. What legitimately appears in this copy is short acronyms and units —
  // "LED", "USB", "XL", "HDMI". A mixed- or lower-case Latin word in the middle
  // of Arabic prose ("Bolsos", "zippers", "Cuttings") is the model losing the
  // language it was asked for, and a ratio test misses it: six stray letters in
  // a forty-letter sentence looks negligible right up until someone reads it.
  for (const run of value.match(/[A-Za-z]+/g) ?? []) {
    if (run !== run.toUpperCase() || run.length > 5) return false;
  }

  return true;
}

function validate(parsed: unknown): AIAnalysisResult | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const item = parsed as Record<string, unknown>;

  const fields = [
    "category",
    "sub_category",
    "condition",
    "suggested_title",
    "suggested_description",
  ] as const;

  for (const field of fields) {
    if (typeof item[field] !== "string" || !(item[field] as string).trim()) {
      return null;
    }
  }

  if (!CONDITIONS.includes(item.condition as string)) return null;

  // The free-text fields are the ones a person reads; the condition is a fixed
  // enum and needs no language check.
  for (const field of [
    "category",
    "sub_category",
    "suggested_title",
    "suggested_description",
  ] as const) {
    if (!isUsableArabic(item[field] as string)) {
      console.error(
        `Vision fallback: rejected ${field} as language-mixed — ${JSON.stringify(
          item[field]
        ).slice(0, 120)}`
      );
      return null;
    }
  }

  return {
    category: item.category as string,
    sub_category: item.sub_category as string,
    condition: item.condition as AIAnalysisResult["condition"],
    suggested_title: item.suggested_title as string,
    suggested_description: item.suggested_description as string,
  };
}

/* -------------------------------------------------------------------------- */
/* Availability                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A model that just refused is set aside rather than retried on every request.
 *
 * This is what makes it safe to keep an unfunded or exhausted provider in the
 * chain: the first search discovers it is unavailable, and every search after
 * that skips it outright instead of paying a doomed round trip. It comes back
 * on its own once the cooldown lapses, so funding an account or a daily reset
 * needs no code change and no restart.
 */
interface Rest {
  until: number;
  /**
   * True when retrying cannot possibly help. A spent rate limit resolves by
   * waiting; an unfunded account does not, so it is skipped outright rather
   * than merely deprioritised — otherwise it costs a doomed round trip on
   * every search where everything else has also failed.
   */
  hard: boolean;
}

const cooldownUntil = new Map<string, Rest>();

/** Billing state, not congestion — credits will not appear in a minute. */
const BILLING_COOLDOWN_MS = 60 * 60 * 1000;

/** A spent daily allowance is worth an occasional probe, not a constant one. */
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000;

/** Overloaded, stalled, or a transport error: usually clears quickly. */
const TRANSIENT_COOLDOWN_MS = 60 * 1000;

/**
 * Ceiling on one model's turn, as distinct from the budget for the walk.
 *
 * The latency profile above is exactly the case this exists for: a fast median
 * with a very long tail means the first model stalling is both likely and
 * survivable — but only if the stall is capped at its own slice. Sharing one
 * deadline let a single hung request spend the whole budget, so the second
 * model was never tried and the donor waited the full timeout for nothing.
 */
const ATTEMPT_TIMEOUT_MS = 9_000;

function resting(key: string): Rest | null {
  const rest = cooldownUntil.get(key);
  if (!rest) return null;

  if (Date.now() >= rest.until) {
    cooldownUntil.delete(key);
    return null;
  }
  return rest;
}

function restFor(key: string, ms: number, hard = false) {
  cooldownUntil.set(key, { until: Date.now() + ms, hard });
}

/** Distinguishes "needs a card" from "try again shortly". */
function cooldownForResponse(
  status: number,
  body: string
): { ms: number; hard: boolean } {
  const billing =
    body.includes("credit_balance_exhausted") ||
    body.includes("insufficient_quota") ||
    body.includes("billing");

  if (billing) return { ms: BILLING_COOLDOWN_MS, hard: true };
  if (status === 429) return { ms: QUOTA_COOLDOWN_MS, hard: false };
  return { ms: TRANSIENT_COOLDOWN_MS, hard: false };
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

type Content =
  | string
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

/**
 * Walks every configured provider and model until one returns JSON that passes
 * `accept`. A response that parses but fails validation is treated exactly like
 * a transport failure — the next model is tried — because a plausible-looking
 * wrong answer is the thing these free models actually produce.
 */
async function callFallback<T>(
  task: "vision" | "text",
  content: Content[],
  schema: object,
  schemaName: string,
  timeoutMs: number,
  accept: (parsed: unknown) => T | null
): Promise<T | null> {
  const configured = providers(task);
  if (configured.length === 0) return null;

  const deadline = AbortSignal.timeout(timeoutMs);

  // Anything currently resting is moved to the back rather than dropped: if
  // every option is cooling down, a long shot still beats refusing to try.
  const attempts: { provider: Provider; model: string; key: string }[] = [];
  for (const provider of configured) {
    const models =
      task === "vision" ? provider.visionModels : provider.textModels;
    for (const model of models) {
      attempts.push({ provider, model, key: `${provider.name}/${model}` });
    }
  }
  // A hard rest is dropped from the walk entirely; a soft one only loses its
  // place, so a long shot is still taken when nothing else is left.
  const usable = attempts.filter(({ key }) => !resting(key)?.hard);
  usable.sort(
    (a, b) => Number(Boolean(resting(a.key))) - Number(Boolean(resting(b.key)))
  );

  for (const { provider, model, key } of usable) {
    if (deadline.aborted) break;

    // Whichever expires first: this model's own slice, or the whole walk.
    const attempt = AbortSignal.any([
      deadline,
      AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    ]);

    try {
      const response = await fetch(provider.baseUrl, {
        method: "POST",
        signal: attempt,
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content }],
          response_format: {
            type: "json_schema",
            json_schema: { name: schemaName, strict: true, schema },
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        const rest = cooldownForResponse(response.status, detail);
        restFor(key, rest.ms, rest.hard);
        console.error(
          `Fallback ${task}: ${provider.name}/${model} returned ${
            response.status
          } — ${detail.slice(0, 160)}`
        );
        continue;
      }

      const body = await response.json();
      const raw = body?.choices?.[0]?.message?.content;
      if (typeof raw !== "string" || !raw) {
        console.error(
          `Fallback ${task}: ${provider.name}/${model} returned no content.`
        );
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error(
          `Fallback ${task}: ${provider.name}/${model} returned non-JSON.`
        );
        continue;
      }

      const result = accept(parsed);
      if (result !== null) {
        cooldownUntil.delete(key);
        console.log(
          `Fallback ${task}: answered by ${provider.name}/${model}.`
        );
        return result;
      }
    } catch (error) {
      // The overall deadline expiring says nothing about this model, and the
      // walk ends here regardless, so it keeps its place for next time.
      if (deadline.aborted) {
        console.error(
          `Fallback ${task}: ${provider.name}/${model} cut short — out of time.`
        );
        break;
      }

      restFor(key, TRANSIENT_COOLDOWN_MS);
      console.error(
        `Fallback ${task}: ${provider.name}/${model} failed —`,
        error
      );
    }
    }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Image analysis                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Second opinion on a donation photo, used only once every Gemini model has
 * refused. Returns `null` when nothing usable came back, leaving the donor to
 * fill the fields in by hand.
 */
export async function analyzeImageWithFallbackProvider(
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<AIAnalysisResult | null> {
  return callFallback(
    "vision",
    [
      { type: "text", text: prompt },
      {
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64Data}` },
      },
    ],
    RESPONSE_SCHEMA,
    "donation_analysis",
    FALLBACK_TIMEOUT_MS,
    validate
  );
}

/* -------------------------------------------------------------------------- */
/* Match reranking                                                            */
/* -------------------------------------------------------------------------- */

export interface FallbackVerdict {
  index: number;
  score: number;
  verdict: string;
  reasons: string[];
  concerns: string[];
}

/**
 * OpenAI-style structured output requires an object at the root, so the array
 * of verdicts travels inside `results`.
 */
const RERANK_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          score: { type: "integer" },
          verdict: {
            type: "string",
            enum: ["مطابق تماماً", "مناسب", "بديل محتمل", "غير مناسب"],
          },
          reasons: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
        },
        required: ["index", "score", "verdict", "reasons", "concerns"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
} as const;

/**
 * The lowest relevance a verdict label implies, regardless of the number that
 * came with it.
 *
 * Free models keep the *labels* straight but not the scale: asked for 0-100,
 * the same model returned 90/15/5 on one call and 3/1/0 on the next, and once
 * labelled an item "مطابق تماماً" while scoring it 9. Taken at face value a
 * perfect match scores below the relevance floor and disappears — the
 * beneficiary is told nothing suitable exists while it sits in the catalogue.
 *
 * The label is the part these models get right, so it sets a floor and the
 * number may only raise it. Deliberately not applied to Gemini, whose scale has
 * been consistent and whose thresholds are calibrated against it.
 */
const VERDICT_FLOOR: Record<string, number> = {
  "مطابق تماماً": 85,
  مناسب: 65,
  "بديل محتمل": 35,
  "غير مناسب": 0,
};

/** Reranking is not blocking a form, but a beneficiary is still waiting. */
const RERANK_FALLBACK_TIMEOUT_MS = 25_000;

/**
 * Ranks match candidates when every Gemini model has refused.
 *
 * This is the half of the platform that actually runs out: Gemini meters
 * generateContent per model per day, and matching spends it far faster than
 * photo analysis does. Without this the page silently drops to embedding-only
 * ordering for the rest of the day.
 */
export async function rerankWithFallbackProvider(
  prompt: string,
  candidateCount: number
): Promise<FallbackVerdict[] | null> {
  return callFallback(
    "text",
    [{ type: "text", text: prompt }],
    RERANK_SCHEMA,
    "match_rerank",
    RERANK_FALLBACK_TIMEOUT_MS,
    (parsed) => {
      const rows = (parsed as { results?: unknown })?.results;
      if (!Array.isArray(rows) || rows.length === 0) return null;

      const verdicts: FallbackVerdict[] = [];
      for (const row of rows) {
        // Model-produced indexes are untrusted input.
        if (!Number.isInteger(row?.index)) continue;
        if (row.index < 0 || row.index >= candidateCount) continue;

        // Unlike the vision path, a bad sentence does not sink the whole
        // verdict: the score is still useful, so only the unreadable lines are
        // dropped and the item keeps its rank.
        const raw = Math.max(0, Math.min(100, Number(row.score) || 0));
        const label = String(row.verdict ?? "");

        verdicts.push({
          index: row.index,
          score: Math.max(raw, VERDICT_FLOOR[label] ?? 0),
          verdict: label,
          reasons: (Array.isArray(row.reasons) ? row.reasons : [])
            .filter((r: unknown) => typeof r === "string" && isUsableArabic(r))
            .slice(0, 3),
          concerns: (Array.isArray(row.concerns) ? row.concerns : [])
            .filter((c: unknown) => typeof c === "string" && isUsableArabic(c))
            .slice(0, 2),
        });
      }

      return verdicts.length > 0 ? verdicts : null;
    }
  );
}
