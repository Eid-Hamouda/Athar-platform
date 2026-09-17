import { GoogleGenAI } from "@google/genai";
import type {
  GenerateContentParameters,
  GenerateContentResponse,
} from "@google/genai";

/**
 * Shared Gemini access for every AI feature on the platform.
 *
 * The key is read from `GEMINI_API_KEY`, never `NEXT_PUBLIC_GEMINI_API_KEY`:
 * `NEXT_PUBLIC_` variables are inlined into the browser bundle, so anyone could
 * lift the key out of the shipped JavaScript. Everything here runs behind a
 * Server Action, so the server-only variable is all that is needed.
 */
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Generation models in preference order, tried until one answers.
 *
 * There is no unlimited free model to fall back on — every hosted model is
 * metered. What makes this list worth having is that the free tier meters
 * *per model*: the quota returned with a 429 is
 * `GenerateRequestsPerDayPerProjectPerModel-FreeTier`, 20 requests per day,
 * counted separately for each entry below. Six models is therefore six
 * separate allowances rather than one shared pool, and the feature keeps
 * working after any single one is spent.
 *
 * Order is by judgement quality, not speed: the list is walked top-down, so
 * normal traffic gets the strongest model and only sustained pressure pushes
 * it onto the faster, lighter ones. Every entry here was checked against the
 * reranker's own schema and an Arabic prompt, and against image input for the
 * vision service — each correctly ranked a children's garment above an adult
 * coat and rejected an unrelated item.
 *
 * Deliberately excluded:
 *   - the `-latest` aliases, which resolve onto a model already listed and so
 *     would share its allowance while hiding which model actually ran;
 *   - the Gemma models, which ignore `responseSchema` and answer with fenced
 *     or truncated text that will not parse.
 */
export const GENERATION_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

/**
 * A model that has just refused is very likely to refuse again, so it is set
 * aside rather than retried on every request. Without this, a spent daily
 * allowance would cost a doomed round trip on every single search for the rest
 * of the day, and the walk would get slower the more models were added.
 *
 * Process-local and short-lived on purpose: the point is to skip a model that
 * is failing right now, not to keep a verdict on it. A daily quota outlives the
 * cooldown, which is correct — one cheap probe every few minutes is how the
 * model gets picked back up the moment it is available again.
 */
const cooldownUntil = new Map<string, number>();

/** Exhausted allowance — worth probing occasionally, not constantly. */
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000;

/** Overloaded or hung: usually clears in seconds. */
const TRANSIENT_COOLDOWN_MS = 30 * 1000;

function isCoolingDown(model: string): boolean {
  const until = cooldownUntil.get(model);
  if (until === undefined) return false;

  if (Date.now() >= until) {
    cooldownUntil.delete(model);
    return false;
  }
  return true;
}

function markUnavailable(model: string, error: unknown) {
  const status = (error as { status?: number })?.status;
  cooldownUntil.set(
    model,
    Date.now() + (status === 429 ? QUOTA_COOLDOWN_MS : TRANSIENT_COOLDOWN_MS)
  );
}

function describe(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 429) return "429 (daily allowance spent)";
  if (status === 503) return "503 (overloaded)";
  if (status) return `${status}`;
  return (error as Error)?.name === "AbortError"
    ? "timed out"
    : String((error as Error)?.message ?? error).slice(0, 120);
}

/**
 * Runs `generateContent` against each model in turn until one responds.
 *
 * The timeout matters as much as the fallback: a Gemini request can hang open
 * rather than fail, and one observed call sat for five minutes before the
 * socket gave up — long enough to look like a broken page. The deadline spans
 * the whole walk, so the worst case stays bounded however long the list gets.
 *
 * Returns `null` when every model failed; callers are expected to degrade
 * rather than surface an error.
 */
export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model"> & {
    /** Used only in logs, to identify which feature was calling. */
    label: string;
    timeoutMs: number;
    models?: string[];
  }
): Promise<GenerateContentResponse | null> {
  const { label, timeoutMs, models = GENERATION_MODELS, ...request } = params;
  const deadline = AbortSignal.timeout(timeoutMs);

  // Models known to be failing are moved to the back rather than dropped: if
  // every one of them is cooling down, trying a spent model is still better
  // than refusing to try at all.
  const ready = models.filter((model) => !isCoolingDown(model));
  const resting = models.filter((model) => isCoolingDown(model));
  const order = [...ready, ...resting];

  for (const model of order) {
    if (deadline.aborted) break;

    try {
      const response = await ai.models.generateContent({
        ...request,
        model,
        config: { ...request.config, abortSignal: deadline },
      });

      if (response?.text) {
        cooldownUntil.delete(model);
        return response;
      }

      // A 200 with no text is not a transport failure, so it is not held
      // against the model — but it is not an answer either.
      console.error(`${label}: ${model} returned an empty response.`);
    } catch (error) {
      markUnavailable(model, error);
      console.error(`${label}: ${model} unavailable — ${describe(error)}`);
    }
  }

  console.error(`${label}: every model failed or timed out.`);
  return null;
}
