import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { SYSTEM_INSTRUCTION, JSON_SCHEMA_DESCRIPTION, buildUserPrompt } from '../prompts/reportAnalysisPrompt.js';

// Zod schema strictly enforcing Requirement 3
export const reportAnalysisSchema = z.object({
  disaster_type: z.enum(['flood', 'cyclone', 'landslide', 'earthquake', 'fire', 'extreme_weather', 'other']).catch('other'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  people_affected: z.number().int().nonnegative().nullable(),
  medical_need: z.boolean().nullable(),
  requirements: z.array(z.string()).default([]),
  urgency: z.enum(['routine', 'soon', 'urgent', 'immediate']),
  red_flags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1)
});

/**
 * Clean and parse raw JSON text from Gemini, stripping any accidental markdown blocks.
 */
function parseJsonSafely(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI model');
  }

  let cleaned = rawText.trim();
  // Strip ```json ... ``` or ``` ... ``` code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt extracting first JSON object substring if model added commentary
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error('Failed to parse model output as JSON');
  }
}

/**
 * Analyze an emergency report using Google Gemini AI.
 * 
 * @param {Object} params
 * @param {string} params.description
 * @param {string} [params.location]
 * @param {string} [params.disasterType]
 * @returns {Promise<Object>} Validated structured analysis
 */
export async function analyzeReportWithGemini({ description, location = '', disasterType = '' }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    const error = new Error('Gemini API key is not configured');
    error.statusCode = 503;
    error.clientMessage = 'AI analysis is temporarily unavailable.';
    throw error;
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = buildUserPrompt({ description, location, disasterType });
  const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n${JSON_SCHEMA_DESCRIPTION}\n\n${userPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: configuredModel,
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const rawText = response.text;
    const parsedData = parseJsonSafely(rawText);

    // Validate strictly against schema
    const validatedData = reportAnalysisSchema.parse(parsedData);
    return validatedData;
  } catch (err) {
    // Check if error is schema validation error
    if (err instanceof z.ZodError) {
      console.error('[Gemini Service] Schema validation error:', err.issues);
      const error = new Error('AI output did not match expected schema');
      error.statusCode = 502;
      error.clientMessage = 'AI analysis is temporarily unavailable.';
      throw error;
    }

    // Log internal error safely on the server without exposing to client
    console.error('[Gemini Service] API or processing error:', err.message || err);

    const error = new Error('AI analysis processing failed');
    error.statusCode = 503;
    error.clientMessage = 'AI analysis is temporarily unavailable.';
    throw error;
  }
}
