/**
 * RELIEF-OS Deterministic Relief Priority Engine
 * 
 * PURE FUNCTIONS ONLY — ZERO ML, ZERO GEMINI CALLS IN THIS ENGINE.
 * Formula:
 * score = (
 *   populationImpact * 0.25 +
 *   severity * 0.20 +
 *   medicalRisk * 0.20 +
 *   resourceShortage * 0.15 +
 *   accessibilityDifficulty * 0.10 +
 *   vulnerability * 0.10
 * ) * 100
 * 
 * Round to nearest integer (0–100).
 */

import { DEFAULT_PRIORITY_WEIGHTS } from '../config/priorityWeights.js';

export const SEVERITY_SCALE = {
  low: 0.25,
  medium: 0.50,
  high: 0.75,
  critical: 1.00
};

/**
 * Normalizes affected population to 0–1 relative to highest zone population.
 * Safely guards against 0, null, undefined, or division by zero.
 */
export function normalizePopulation(population, maxPopulation) {
  if (!population || typeof population !== 'number' || population <= 0 || isNaN(population)) {
    return 0;
  }
  if (!maxPopulation || typeof maxPopulation !== 'number' || maxPopulation <= 0 || isNaN(maxPopulation)) {
    return 0;
  }
  const ratio = population / maxPopulation;
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Maps severity string to deterministic 0–1 score.
 * Low: 0.25, Medium: 0.50, High: 0.75, Critical: 1.00
 */
export function mapSeverityToScore(severityString) {
  if (!severityString || typeof severityString !== 'string') return 0;
  const key = severityString.toLowerCase().trim();
  return SEVERITY_SCALE[key] || 0;
}

/**
 * Computes zone severity from reports using the documented MVP rule:
 * Highest supported severity among reports, falling back to baseline.
 */
export function calculateSeverity(reports = [], baselineSeverity = 0) {
  let maxScore = typeof baselineSeverity === 'number'
    ? baselineSeverity
    : mapSeverityToScore(baselineSeverity);

  if (Array.isArray(reports)) {
    for (const report of reports) {
      const aiSeverity = report.aiAnalysis?.severity;
      if (aiSeverity) {
        const score = mapSeverityToScore(aiSeverity);
        if (score > maxScore) {
          maxScore = score;
        }
      }
    }
  }

  return Math.min(1, Math.max(0, maxScore));
}

/**
 * Deterministically aggregates medical risk from AI-extracted medical need and red flags.
 * Rule:
 * - No medical need: 0.0
 * - Medical need present: 0.7
 * - Medical emergency / strong medical red flag: 1.0
 */
export function calculateMedicalRisk(reports = [], baselineMedicalRisk = 0) {
  let maxRisk = typeof baselineMedicalRisk === 'number' ? baselineMedicalRisk : 0;

  if (Array.isArray(reports)) {
    for (const report of reports) {
      const analysis = report.aiAnalysis;
      if (!analysis) continue;

      const redFlags = Array.isArray(analysis.red_flags) ? analysis.red_flags : [];
      const hasMedicalRedFlag = redFlags.some((flag) => {
        if (!flag || typeof flag !== 'string') return false;
        const f = flag.toLowerCase();
        return (
          f.includes('breathing') ||
          f.includes('medical') ||
          f.includes('bleeding') ||
          f.includes('injured') ||
          f.includes('unconscious') ||
          f.includes('cardiac') ||
          f.includes('emergency') ||
          f.includes('pregnant') ||
          f.includes('trauma')
        );
      });

      if (hasMedicalRedFlag) {
        maxRisk = Math.max(maxRisk, 1.0);
      } else if (analysis.medical_need === true) {
        maxRisk = Math.max(maxRisk, 0.7);
      }
    }
  }

  return Math.min(1, Math.max(0, maxRisk));
}

/**
 * Computes resource shortage factor (0–1).
 * Considers reported requirements (food, water, medicine, rescue_boat) and baseline inventory.
 */
export function calculateResourceShortage(reports = [], baselineShortage = 0) {
  let shortage = typeof baselineShortage === 'number' ? baselineShortage : 0;

  if (Array.isArray(reports) && reports.length > 0) {
    let reqCount = 0;
    let criticalReqs = 0;

    for (const r of reports) {
      const reqs = r.aiAnalysis?.requirements;
      if (Array.isArray(reqs)) {
        reqCount += reqs.length;
        if (reqs.includes('rescue_boat') || reqs.includes('medical_team') || reqs.includes('medicine')) {
          criticalReqs++;
        }
      }
    }

    if (criticalReqs > 0) {
      shortage = Math.max(shortage, 0.75);
    } else if (reqCount > 0) {
      shortage = Math.max(shortage, 0.50);
    }
  }

  return Math.min(1, Math.max(0, shortage));
}

/**
 * Calculates accessibility difficulty factor (0–1).
 */
export function calculateAccessibility(zone, reports = []) {
  let difficulty = typeof zone?.accessibilityDifficulty === 'number'
    ? zone.accessibilityDifficulty
    : (zone?.factors?.accessibilityDifficulty || 0.2);

  // If reports indicate cut-off roads or isolation
  if (Array.isArray(reports)) {
    for (const r of reports) {
      const redFlags = r.aiAnalysis?.red_flags || [];
      const desc = (r.description || '').toLowerCase();
      if (
        redFlags.some(f => typeof f === 'string' && (f.includes('stranded') || f.includes('evacuation'))) ||
        desc.includes('submerged') ||
        desc.includes('cut off') ||
        desc.includes('flooded road')
      ) {
        difficulty = Math.max(difficulty, 0.85);
      }
    }
  }

  return Math.min(1, Math.max(0, difficulty));
}

/**
 * Calculates demographic vulnerability factor (0–1).
 */
export function calculateVulnerability(zone) {
  const vuln = typeof zone?.vulnerability === 'number'
    ? zone.vulnerability
    : (zone?.factors?.vulnerability || 0.5);
  return Math.min(1, Math.max(0, vuln));
}

/**
 * Calculates raw priority score from 6 factors and weights.
 * Always clamps to 0–100 integer.
 */
export function calculatePriorityScore(factors, weights = DEFAULT_PRIORITY_WEIGHTS) {
  const pop = typeof factors.populationImpact === 'number' ? factors.populationImpact : 0;
  const sev = typeof factors.severity === 'number' ? factors.severity : 0;
  const med = typeof factors.medicalRisk === 'number' ? factors.medicalRisk : 0;
  const shortage = typeof factors.resourceShortage === 'number' ? factors.resourceShortage : 0;
  const access = typeof factors.accessibilityDifficulty === 'number' ? factors.accessibilityDifficulty : 0;
  const vuln = typeof factors.vulnerability === 'number' ? factors.vulnerability : 0;

  const w = { ...DEFAULT_PRIORITY_WEIGHTS, ...weights };

  const raw = (
    pop * w.populationImpact +
    sev * w.severity +
    med * w.medicalRisk +
    shortage * w.resourceShortage +
    access * w.accessibilityDifficulty +
    vuln * w.vulnerability
  ) * 100;

  const rounded = Math.round(raw);
  return Math.min(100, Math.max(0, rounded));
}

/**
 * Maps numeric score (0–100) to exact PRD priority bands:
 * Critical: score >= 85
 * High:     70 <= score <= 84
 * Medium:   50 <= score <= 69
 * Low:      score < 50
 */
export function getPriorityBand(score) {
  if (typeof score !== 'number' || isNaN(score)) return 'Low';
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

/**
 * Computes exact weighted contribution of each factor toward the 100-point total.
 */
export function calculateScoreBreakdown(factors, weights = DEFAULT_PRIORITY_WEIGHTS) {
  const w = { ...DEFAULT_PRIORITY_WEIGHTS, ...weights };

  const pop = typeof factors.populationImpact === 'number' ? factors.populationImpact : 0;
  const sev = typeof factors.severity === 'number' ? factors.severity : 0;
  const med = typeof factors.medicalRisk === 'number' ? factors.medicalRisk : 0;
  const shortage = typeof factors.resourceShortage === 'number' ? factors.resourceShortage : 0;
  const access = typeof factors.accessibilityDifficulty === 'number' ? factors.accessibilityDifficulty : 0;
  const vuln = typeof factors.vulnerability === 'number' ? factors.vulnerability : 0;

  const populationContribution = parseFloat((pop * w.populationImpact * 100).toFixed(1));
  const severityContribution = parseFloat((sev * w.severity * 100).toFixed(1));
  const medicalContribution = parseFloat((med * w.medicalRisk * 100).toFixed(1));
  const shortageContribution = parseFloat((shortage * w.resourceShortage * 100).toFixed(1));
  const accessibilityContribution = parseFloat((access * w.accessibilityDifficulty * 100).toFixed(1));
  const vulnerabilityContribution = parseFloat((vuln * w.vulnerability * 100).toFixed(1));

  const total = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        populationContribution +
        severityContribution +
        medicalContribution +
        shortageContribution +
        accessibilityContribution +
        vulnerabilityContribution
      )
    )
  );

  return {
    populationContribution,
    severityContribution,
    medicalContribution,
    shortageContribution,
    accessibilityContribution,
    vulnerabilityContribution,
    total
  };
}

/**
 * Generates transparent, deterministic, plain-language explanation of zone score.
 * Never invents unsupported numbers.
 */
export function generateScoreExplanation({
  name,
  priorityBand,
  affectedPopulation,
  factors,
  scoreBreakdown,
  reportCount = 0
}) {
  const parts = [];

  if (affectedPopulation && affectedPopulation > 0) {
    parts.push(`${affectedPopulation.toLocaleString()} affected residents`);
  }

  if (factors.severity >= 0.75) {
    parts.push('critical incident severity');
  } else if (factors.severity >= 0.5) {
    parts.push('moderate flood severity');
  }

  if (factors.medicalRisk >= 0.7) {
    parts.push('high medical distress');
  }

  if (factors.resourceShortage >= 0.6) {
    parts.push('acute resource deficits');
  }

  if (factors.accessibilityDifficulty >= 0.7) {
    parts.push('cut off road access');
  }

  if (reportCount > 0) {
    parts.push(`${reportCount} citizen emergency ${reportCount === 1 ? 'report' : 'reports'}`);
  }

  const driverText = parts.length > 0 ? parts.join(', ') : 'baseline territorial monitoring';
  return `${name} ranked ${priorityBand} primarily driven by ${driverText}.`;
}

/**
 * Complete deterministic zone calculation.
 * Accepts zone data, assigned reports, max population in disaster set, and optional custom weights.
 */
export function calculateZonePriority(zone, assignedReports = [], maxPopulation = 1, weights = DEFAULT_PRIORITY_WEIGHTS) {
  const popCount = typeof zone.affectedPopulation === 'number'
    ? zone.affectedPopulation
    : parseInt(String(zone.affectedPopulation || '0').replace(/,/g, ''), 10) || 0;

  const populationImpact = normalizePopulation(popCount, maxPopulation);
  const severity = calculateSeverity(assignedReports, zone.factors?.severity ?? zone.baselineSeverity);
  const medicalRisk = calculateMedicalRisk(assignedReports, zone.factors?.medicalRisk ?? zone.baselineMedicalRisk);
  const resourceShortage = calculateResourceShortage(assignedReports, zone.factors?.resourceShortage ?? zone.baselineShortage);
  const accessibilityDifficulty = calculateAccessibility(zone, assignedReports);
  const vulnerability = calculateVulnerability(zone);

  const factors = {
    populationImpact,
    severity,
    medicalRisk,
    resourceShortage,
    accessibilityDifficulty,
    vulnerability
  };

  const scoreBreakdown = calculateScoreBreakdown(factors, weights);
  const priorityScore = scoreBreakdown.total;
  const priorityBand = getPriorityBand(priorityScore);

  const explanation = generateScoreExplanation({
    name: zone.name,
    priorityBand,
    affectedPopulation: popCount,
    factors,
    scoreBreakdown,
    reportCount: assignedReports.length
  });

  return {
    ...zone,
    reportIds: assignedReports.map(r => r.id),
    reportCount: assignedReports.length,
    factors,
    scoreBreakdown,
    priorityScore,
    priorityBand,
    explanation,
    isSimulated: true
  };
}
