/**
 * RELIEF-OS Priority Engine Weight Configuration
 * PRD-mandated deterministic relief priority weights.
 * Configurable for future admin policy customization.
 */

export const DEFAULT_PRIORITY_WEIGHTS = {
  populationImpact: 0.25,
  severity: 0.20,
  medicalRisk: 0.20,
  resourceShortage: 0.15,
  accessibilityDifficulty: 0.10,
  vulnerability: 0.10
};

export const FACTOR_METADATA = {
  populationImpact: {
    label: 'Population Impact',
    maxContribution: 25,
    description: 'Normalized volume of affected population relative to event maximum.',
    icon: 'Users'
  },
  severity: {
    label: 'Severity Level',
    maxContribution: 20,
    description: 'Incident severity level determined from citizen reports and ground observations.',
    icon: 'AlertOctagon'
  },
  medicalRisk: {
    label: 'Medical Risk',
    maxContribution: 20,
    description: 'Presence of injuries, breathing distress, triage requirements, or medical red flags.',
    icon: 'HeartPulse'
  },
  resourceShortage: {
    label: 'Resource Shortage',
    maxContribution: 15,
    description: 'Critical deficits in potable water, food rations, and medical triage supplies.',
    icon: 'AlertTriangle'
  },
  accessibilityDifficulty: {
    label: 'Accessibility Difficulty',
    maxContribution: 10,
    description: 'Terrain disruption, submerged road links, and physical access impediments.',
    icon: 'Navigation'
  },
  vulnerability: {
    label: 'Vulnerability Index',
    maxContribution: 10,
    description: 'Demographic baseline of elderly residents, children, and remote communities.',
    icon: 'ShieldAlert'
  }
};

/**
 * Validates that weights object has all required factors and sums to 1.0.
 * Allows a tiny floating-point epsilon (0.001) for numeric precision.
 * 
 * @param {Object} weights 
 * @returns {{ valid: boolean, sum: number, error?: string }}
 */
export function validateWeights(weights = DEFAULT_PRIORITY_WEIGHTS) {
  const requiredFactors = [
    'populationImpact',
    'severity',
    'medicalRisk',
    'resourceShortage',
    'accessibilityDifficulty',
    'vulnerability'
  ];

  for (const factor of requiredFactors) {
    if (typeof weights[factor] !== 'number' || weights[factor] < 0 || isNaN(weights[factor])) {
      return {
        valid: false,
        sum: 0,
        error: `Invalid or missing weight for factor: ${factor}`
      };
    }
  }

  const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
  const isSumToOne = Math.abs(sum - 1.0) <= 0.001;

  if (!isSumToOne) {
    return {
      valid: false,
      sum,
      error: `Weights must sum to 1.0 (current sum: ${sum.toFixed(4)})`
    };
  }

  return {
    valid: true,
    sum: 1.0
  };
}
