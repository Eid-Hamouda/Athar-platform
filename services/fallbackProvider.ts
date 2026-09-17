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
   * In preference order. Measured against a real donation photo with the real
   * Arabic prompt; see `isUsableArabic` for why this list is so short.
   */
  models: string[];
}

function providers(): Provider[] {
  return [
    {
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      // Two entries because the guard below makes an unreliable model cheap to
      // try: a garbled answer is rejected in microseconds and the next one runs.
      // `nex-n2.5-pro` leads because it was the only model that stayed clean
      // across repeated runs; `dots-3` is fast but produced language-mixed text
      // in two runs out of three, so it is a second chance, not a first choice.
      models: (
        process.env.OPENROUTER_VISION_MODELS ??
        "nex-agi/nex-n2.5-pro:free,dots-studio/dots-3-note-preview:free"
      )
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean),
    },
    // Same shape, different pool. Set GROQ_API_KEY and GROQ_VISION_MODELS to
    // enable; both are OpenAI-compatible, so nothing else needs to change.
    {
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      models: (process.env.GROQ_VISION_MODELS ?? "")
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean),
    },
  ].filter((provider) => provider.apiKey && provider.models.length > 0);
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

/**
 * Tries each configured provider and model until one returns a response that is
 * both schema-valid and readable. Returns `null` when none does, leaving the
 * donor to fill the fields in by hand.
 */
export async function analyzeImageWithFallbackProvider(
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<AIAnalysisResult | null> {
  const configured = providers();
  if (configured.length === 0) return null;

  const deadline = AbortSignal.timeout(FALLBACK_TIMEOUT_MS);
  const dataUri = `data:${mimeType};base64,${base64Data}`;

  for (const provider of configured) {
    for (const model of provider.models) {
      if (deadline.aborted) break;

      try {
        const response = await fetch(provider.baseUrl, {
          method: "POST",
          signal: deadline,
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: dataUri } },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "donation_analysis",
                strict: true,
                schema: RESPONSE_SCHEMA,
              },
            },
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          console.error(
            `Vision fallback: ${provider.name}/${model} returned ${
              response.status
            } — ${detail.slice(0, 160)}`
          );
          continue;
        }

        const body = await response.json();
        const content = body?.choices?.[0]?.message?.content;
        if (typeof content !== "string" || !content) {
          console.error(
            `Vision fallback: ${provider.name}/${model} returned no content.`
          );
          continue;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          console.error(
            `Vision fallback: ${provider.name}/${model} returned non-JSON.`
          );
          continue;
        }

        const result = validate(parsed);
        if (result) {
          console.log(`Vision fallback: answered by ${provider.name}/${model}.`);
          return result;
        }
      } catch (error) {
        console.error(
          `Vision fallback: ${provider.name}/${model} failed —`,
          error
        );
      }
    }
  }

  return null;
}
