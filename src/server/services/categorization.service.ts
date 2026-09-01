import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { db } from "@/server/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const AiResponseSchema = z.array(
  z.object({
    description: z.string(),
    category: z.string(),
    confidence: z.number().min(0).max(1),
  })
);

export async function resolveFromCache(descriptions: string[]) {
  const hits = await db.categorizationCache.findMany({
    where: { normalizedDescription: { in: descriptions } },
  });
  return new Map(hits.map((h) => [h.normalizedDescription, h]));
}

export async function categorizeWithAI(
  descriptions: string[],
  categoryNames: string[]
) {
  if (descriptions.length === 0) return new Map();

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json", // fuerza JSON válido
      temperature: 0,                        // determinista
    },
  });

  const prompt = `Categoriza cada descripción de transacción bancaria en UNA de estas categorías exactas:
${categoryNames.join(", ")}

Descripciones:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Responde con un array JSON:
[{"description": "...", "category": "...", "confidence": 0.95}]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = AiResponseSchema.parse(JSON.parse(text));
    const valid = parsed.filter((p) => categoryNames.includes(p.category));

    return new Map(valid.map((p) => [p.description, p]));
  } catch (err) {
    console.error("[categorization] fallo de IA:", err);
    return new Map();
  }
}