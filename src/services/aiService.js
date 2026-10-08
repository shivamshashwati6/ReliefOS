/**
 * RELIEF-OS Frontend AI Service
 * Communicates with backend Express server (never exposes Gemini API key on frontend).
 */

export async function analyzeReportWithAi({ description, location = '', disasterType = '' }) {
  try {
    const response = await fetch('/api/ai/analyze-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        location,
        disasterType
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'AI analysis is temporarily unavailable.');
    }

    return data.analysis || data;
  } catch (err) {
    // If backend is unreachable or returns an error
    console.error('[AI Service Error]:', err.message || err);
    throw new Error(err.message || 'AI analysis is temporarily unavailable.');
  }
}
