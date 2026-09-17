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
 * The same models, ordered for image analysis rather than for judgement.
 *
 * Reading a photo of a donated item is the easiest thing either tier is asked
 * to do, and the ordering above buys nothing on it while costing a great deal.
 * Measured on one donation photo, all six with an identical prompt and schema:
 *
 *   gemini-3.5-flash-lite     3.6s   accurate, concrete Arabic
 *   gemini-3.7-flash          503 after 7.9s
 *   gemini-3.6-flash          503 after 12.3s
 *   gemini-3.5-flash          503 after 5.3s — and 18.6s on the run it answered
 *   gemini-3-flash-preview    17.8s
 *
 * The heavier models are where free-tier demand concentrates, so on this task
 * they are both likelier to refuse and slower when they do not. Their answers
 * were also no better: the lite model named the apple, the crayons and the
 * lettered blocks, which is exactly the concrete detail the reranker reads.
 *
 * They stay in the list rather than being dropped, because each still carries
 * its own 20-a-day allowance and congestion moves — gemini-3.5-flash answered
 * in one run and refused in the next, minutes apart. This is an ordering, not
 * a verdict.
 *
 * `gemini-3.8-flash` is deliberately absent: it exists on the key but stalled
 * past 25s on every probe, which is the newest-model demand spike. The 2.5
 * family is absent because it is listed but returns 404 on this tier.
 */
export const VISION_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
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

/** Hung, or a transport error: usually clears in seconds. */
const TRANSIENT_COOLDOWN_MS = 30 * 1000;

/**
 * Overloaded (503) — congestion on Google's side, which lasts minutes, not
 * seconds. Measured on the two leading models: both returned 503 continuously
 * for the length of a session, and each rejection took 8-12 seconds to arrive.
 *
 * That cost is the reason this is separate from the transient nap. With a 30s
 * cooldown, one donor in every 30s window pays roughly 20 seconds to rediscover
 * congestion that has not moved — and, because the walk is ordered by judgement
 * quality, pays it on the two models most likely to be busy. A longer nap means
 * the first donor discovers it and everyone behind them goes straight to a
 * model that answers.
 */
const OVERLOAD_COOLDOWN_MS = 3 * 60 * 1000;

/**
 * Ceiling on a single attempt, as distinct from the deadline across the walk.
 *
 * Without a per-attempt ceiling the two are the same number, and one stalling
 * model swallows the entire budget: an observed run logged a 503 from the
 * first model, a timeout from the second, and then gave up — with four
 * untouched daily allowances still sitting in the list, any of which might
 * have answered in two seconds. A per-model ceiling is what converts a long
 * list from decoration into actual redundancy.
 *
 * Ten seconds is set from measurement, not from taste. A successful vision
 * call on a 1024px photo came back in 7.9s, so anything under about 9s would
 * abort work that was about to succeed; a 503 took 8-12s to arrive, so a much
 * longer ceiling just buys a slower way to be told no. Ten sits between them.
 */
const ATTEMPT_TIMEOUT_MS = 10_000;

function isCoolingDown(model: string): boolean {
  const until = cooldownUntil.get(model);
  if (until === undefined) return false;

  if (Date.now() >= until) {
    cooldownUntil.delete(model);
    return false;
  }
  return true;
}

function cooldownFor(status: number | undefined): number {
  if (status === 429) return QUOTA_COOLDOWN_MS;
  if (status === 503) return OVERLOAD_COOLDOWN_MS;
  return TRANSIENT_COOLDOWN_MS;
}

function markUnavailable(model: string, error: unknown) {
  const status = (error as { status?: number })?.status;
  cooldownUntil.set(model, Date.now() + cooldownFor(status));
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
 * The timeouts matter as much as the fallback: a Gemini request can hang open
 * rather than fail, and one observed call sat for five minutes before the
 * socket gave up — long enough to look like a broken page. There are two
 * ceilings, and both are needed. The deadline spans the whole walk, so the
 * worst case stays bounded however long the list gets; `attemptTimeoutMs`
 * bounds each model separately, so a stalling one costs its own slice rather
 * than everyone else's turn.
 *
 * Returns `null` when every model failed; callers are expected to degrade
 * rather than surface an error.
 */
export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model"> & {
    /** Used only in logs, to identify which feature was calling. */
    label: string;
    /** Ceiling on the whole walk. */
    timeoutMs: number;
    /** Ceiling on any one model's turn. Defaults to ATTEMPT_TIMEOUT_MS. */
    attemptTimeoutMs?: number;
    models?: string[];
  }
): Promise<GenerateContentResponse | null> {
  const {
    label,
    timeoutMs,
    attemptTimeoutMs = ATTEMPT_TIMEOUT_MS,
    models = GENERATION_MODELS,
    ...request
  } = params;
  const deadline = AbortSignal.timeout(timeoutMs);

  // Models known to be failing are moved to the back rather than dropped: if
  // every one of them is cooling down, trying a spent model is still better
  // than refusing to try at all.
  const ready = models.filter((model) => !isCoolingDown(model));
  const resting = models.filter((model) => isCoolingDown(model));
  const order = [...ready, ...resting];

  for (const model of order) {
    if (deadline.aborted) break;

    // Aborts on whichever comes first: this model's own slice, or the walk's
    // deadline. The composite is rebuilt per model so each turn starts fresh.
    const attempt = AbortSignal.any([
      deadline,
      AbortSignal.timeout(attemptTimeoutMs),
    ]);

    try {
      const response = await ai.models.generateContent({
        ...request,
        model,
        config: { ...request.config, abortSignal: attempt },
      });

      if (response?.text) {
        cooldownUntil.delete(model);
        return response;
      }

      // A 200 with no text is not a transport failure, so it is not held
      // against the model — but it is not an answer either.
      console.error(`${label}: ${model} returned an empty response.`);
    } catch (error) {
      // Running out of time overall is not this model's doing, and there is
      // nobody left to try, so it is not held against it on the way out.
      if (deadline.aborted) {
        console.error(`${label}: ${model} cut short — out of time.`);
        break;
      }

      markUnavailable(model, error);
      console.error(`${label}: ${model} unavailable — ${describe(error)}`);
    }
  }

  console.error(`${label}: every model failed or timed out.`);
  return null;
}
