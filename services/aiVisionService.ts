import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export interface AIAnalysisResult {
  category: string;
  sub_category: string;
  condition: "ممتازة" | "جيدة جداً" | "مقبولة";
  suggested_title: string;
}

export async function analyzeImageBuffer(base64Data: string, mimeType: string): Promise<AIAnalysisResult | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
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
            }
          },
          required: ["category", "sub_category", "condition", "suggested_title"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Dynamic AI Engine Error:", error);
    return null;
  }
}