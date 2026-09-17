import { Type } from "@google/genai";

import { generateWithFallback } from "@/services/geminiClient";

/**
 * Image analysis runs while a donor watches an upload spinner, so it gets a
 * shorter leash than matching does: better to ask them to fill the fields in
 * by hand than to hold the form open indefinitely.
 */
const ANALYSIS_TIMEOUT_MS = 20_000;

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

export async function analyzeImageBuffer(base64Data: string, mimeType: string): Promise<AIAnalysisResult | null> {
  try {
    const response = await generateWithFallback({
      label: "Image analysis",
      timeoutMs: ANALYSIS_TIMEOUT_MS,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `Analyze this image of a donated item for a charity platform.
          1. Dynamically determine the most accurate main category and sub-category for this item in Arabic (e.g., category: "إلكترونيات", sub_category: "هواتف ذكية" or category: "ملابس", sub_category: "معاطف شتوية"). Do not limit yourself to a rigid preset list; be precise and descriptive.
          2. Assess its physical condition strictly as one of these three exact values: "ممتازة", "جيدة جداً", or "مقبولة".
          3. Provide a short, catchy suggested Arabic title for the donation item.
          4. Write a description in Arabic, 2-3 short sentences, covering only what is genuinely visible: what the item is, its colour and apparent material, any size or age-group the picture itself makes clear, notable features, and any visible wear or damage.

          Rules for the description, which a beneficiary will rely on to decide whether to request a delivery:
          - State only what the image actually shows. Never invent a brand, an exact size or measurement, a model number, a material you cannot see, or a history of use.
          - If something important cannot be determined from the photo, say so plainly (e.g. "المقاس غير واضح في الصورة") rather than guessing.
          - Mention visible defects honestly; hiding them wastes a delivery and a beneficiary's time.
          - Write plain descriptive Arabic. No marketing language, no praise, no pricing, and no direct address to the reader.
          Return the result strictly as a JSON object.`
        }
      ],
      config: {
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

    // Null here means every model in the fallback list refused or timed out.
    if (response?.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Dynamic AI Engine Error:", error);
    return null;
  }
}