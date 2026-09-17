import { ThinkingLevel, Type } from "@google/genai";

import { generateWithFallback, VISION_MODELS } from "@/services/geminiClient";
import {
  analyzeImageWithFallbackProvider,
  isUsableArabic,
} from "@/services/fallbackProvider";

/**
 * Image analysis runs while a donor watches an upload spinner, so it gets a
 * shorter leash than matching does: better to ask them to fill the fields in
 * by hand than to hold the form open indefinitely.
 *
 * Twenty-four seconds, which is a budget for three or four attempts rather
 * than the one-and-a-bit that twenty used to buy. The arithmetic changed with
 * the model order and the thinking level: a healthy attempt is now ~3.6s, and
 * the expensive case is a 503, which costs 5-12s to be told no. Even a run
 * that refuses twice before landing finishes well inside this.
 *
 * The spinner only runs near the ceiling on a bad day. Once a congested model
 * is cooling down the next donor skips it outright and sees an answer in about
 * four seconds.
 */
const ANALYSIS_TIMEOUT_MS = 24_000;

export interface AIAnalysisResult {
  category: string;
  sub_category: string;
  condition: "ممتازة" | "جيدة جداً" | "مقبولة";
  suggested_title: string;
  /**
   * Two or three factual Arabic sentences about the item.
   *
   * This is not decoration: the description is part of the text that gets
   * embedded and is the field the matching reranker reads most closely, so a
   * concrete one ("كنزات صوفية بألوان داكنة، مقاس يناسب طفلاً") separates a
   * good match from a near miss far better than a category label can.
   */
  suggested_description: string;
}

/**
 * Shared by both providers, so a fallback answer is held to the same rules
 * as the primary one rather than quietly being allowed to guess.
 */
const ANALYSIS_PROMPT = `Analyze this image of a donated item for a charity platform.
          1. Dynamically determine the most accurate main category and sub-category for this item in Arabic (e.g., category: "إلكترونيات", sub_category: "هواتف ذكية" or category: "ملابس", sub_category: "معاطف شتوية"). Do not limit yourself to a rigid preset list; be precise and descriptive.
          2. Assess its physical condition strictly as one of these three exact values: "ممتازة", "جيدة جداً", or "مقبولة".
          3. Provide a short, catchy suggested Arabic title for the donation item.
          4. Write a description in Arabic, 2-3 short sentences, covering only what is genuinely visible: what the item is, its colour and apparent material, any size or age-group the picture itself makes clear, notable features, and any visible wear or damage.

          Rules for the description, which a beneficiary will rely on to decide whether to request a delivery:
          - State only what the image actually shows. Never invent a brand, an exact size or measurement, a model number, a material you cannot see, or a history of use.
          - If something important cannot be determined from the photo, say so plainly (e.g. "المقاس غير واضح في الصورة") rather than guessing.
          - Mention visible defects honestly; hiding them wastes a delivery and a beneficiary's time.
          - Write plain descriptive Arabic. No marketing language, no praise, no pricing, and no direct address to the reader.
          Return the result strictly as a JSON object.`;

export async function analyzeImageBuffer(base64Data: string, mimeType: string): Promise<AIAnalysisResult | null> {
  try {
    const response = await generateWithFallback({
      label: "Image analysis",
      timeoutMs: ANALYSIS_TIMEOUT_MS,
      models: VISION_MODELS,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: ANALYSIS_PROMPT,
        }
      ],
      config: {
        // Reasoning is the single largest cost on this call and buys nothing
        // here. Left at its default the model spent 992 thought tokens working
        // out that a photo of schoolbooks was schoolbooks, taking 7.9s; capped,
        // it returns the same verdict and an equally concrete description with
        // no thought tokens at all, in 3.6-5.6s. Those tokens are generation on
        // a metered tier, so this is cheaper as well as faster.
        //
        // LOW rather than MINIMAL, which is the cheaper setting and measurably
        // no cheaper here — both report zero thought tokens, and the gap
        // between them is run-to-run noise. MINIMAL is rejected outright by
        // gemini-3.7-flash ("Thinking level MINIMAL is not supported for this
        // model", 400), so it would quietly cost a model from the walk to buy
        // nothing. LOW is accepted by all six.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { 
              type: Type.STRING, 
              description: "The dynamic main category of the item in Arabic" 
            },
            sub_category: { 
              type: Type.STRING, 
              description: "The dynamic sub-category or specific type of the item in Arabic" 
            },
            condition: { 
              type: Type.STRING, 
              enum: ["ممتازة", "جيدة جداً", "مقبولة"],
              description: "Must be exactly one of: ممتازة, جيدة جداً, مقبولة" 
            },
            suggested_title: { 
              type: Type.STRING, 
              description: "A short descriptive Arabic title for the item" 
            },
            suggested_description: {
              type: Type.STRING,
              description:
                "2-3 short factual Arabic sentences describing only what is visible in the photo, including any visible wear. No invented brands, sizes or materials.",
            }
          },
          required: [
            "category",
            "sub_category",
            "condition",
            "suggested_title",
            "suggested_description",
          ],
        },
      },
    });

    // Null here means every Gemini model refused or timed out.
    if (response?.text) {
      const parsed = JSON.parse(response.text) as AIAnalysisResult;

      // Applied to the primary provider too, not just the fallback. Gemini has
      // been clean in testing, but the cost of a garbled description reaching a
      // beneficiary is the same whichever model produced it.
      if (isUsableArabic(parsed?.suggested_description ?? "")) {
        return parsed;
      }
      console.error(
        "Image analysis: Gemini returned language-mixed text; trying fallback provider."
      );
    }
  } catch (error) {
    console.error("Dynamic AI Engine Error:", error);
  }

  // Every Gemini model is metered per model per day, so a busy day can empty
  // the whole primary provider. A second provider is a pool that meter cannot
  // drain. Skipped entirely when no fallback key is configured.
  return analyzeImageWithFallbackProvider(base64Data, mimeType, ANALYSIS_PROMPT);
}