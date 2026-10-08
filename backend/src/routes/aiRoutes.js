import express from 'express';
import { analyzeReportWithGemini } from '../services/geminiService.js';

const router = express.Router();

/**
 * POST /api/ai/analyze-report
 * Analyzes a raw citizen emergency report and returns structured operational JSON.
 */
router.post('/analyze-report', async (req, res) => {
  try {
    const { description, location, disasterType } = req.body || {};

    // Validate that description exists and is a non-empty string
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: 'Report description is required for AI analysis.'
      });
    }

    const analysis = await analyzeReportWithGemini({
      description: description.trim(),
      location: typeof location === 'string' ? location.trim() : '',
      disasterType: typeof disasterType === 'string' ? disasterType.trim() : ''
    });

    // Return structured response matching schema both directly and nested for compatibility
    return res.status(200).json({
      success: true,
      ...analysis,
      analysis
    });
  } catch (err) {
    const status = err.statusCode || 500;
    const clientMessage = err.clientMessage || 'AI analysis is temporarily unavailable.';

    // Do not leak stack traces or internal secrets
    return res.status(status).json({
      error: clientMessage
    });
  }
});

export default router;
