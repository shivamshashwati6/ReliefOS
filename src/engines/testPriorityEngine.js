/**
 * RELIEF-OS Priority Engine Test Suite
 * Validates PRD Requirement 24 for the Deterministic Relief Priority Engine.
 */

import {
  calculatePriorityScore,
  getPriorityBand,
  normalizePopulation,
  mapSeverityToScore,
  calculateSeverity,
  calculateMedicalRisk,
  calculateResourceShortage,
  calculateAccessibility,
  calculateVulnerability,
  calculateScoreBreakdown,
  generateScoreExplanation,
  calculateZonePriority
} from './priorityEngine.js';

import {
  DEFAULT_PRIORITY_WEIGHTS,
  validateWeights
} from '../config/priorityWeights.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✓ PASS: ${message} (Expected: ${expected}, Got: ${actual})`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
    failed++;
  }
}

console.log('====================================================');
console.log('RELIEF-OS DETERMINISTIC PRIORITY ENGINE TEST SUITE');
console.log('====================================================\n');

// 1. All factors = 0 -> Expected: 0
console.log('Test 1: All factors = 0');
const allZeroFactors = {
  populationImpact: 0,
  severity: 0,
  medicalRisk: 0,
  resourceShortage: 0,
  accessibilityDifficulty: 0,
  vulnerability: 0
};
assertEqual(calculatePriorityScore(allZeroFactors), 0, 'Priority score is 0 when all factors are 0');

// 2. All factors = 1 -> Expected: 100
console.log('\nTest 2: All factors = 1');
const allOneFactors = {
  populationImpact: 1,
  severity: 1,
  medicalRisk: 1,
  resourceShortage: 1,
  accessibilityDifficulty: 1,
  vulnerability: 1
};
assertEqual(calculatePriorityScore(allOneFactors), 100, 'Priority score is 100 when all factors are 1');

// 3. Example mixed factors -> Verify exact weighted result
console.log('\nTest 3: Example mixed factors verification');
// Example: pop=0.5, sev=0.75, med=1.0, shortage=0.6, access=0.8, vuln=0.4
// pop: 0.5 * 0.25 = 0.125
// sev: 0.75 * 0.20 = 0.150
// med: 1.0 * 0.20 = 0.200
// shortage: 0.6 * 0.15 = 0.090
// access: 0.8 * 0.10 = 0.080
// vuln: 0.4 * 0.10 = 0.040
// Total = (0.125 + 0.150 + 0.200 + 0.090 + 0.080 + 0.040) * 100 = 0.685 * 100 = 68.5 -> rounded = 69
const mixedFactors = {
  populationImpact: 0.5,
  severity: 0.75,
  medicalRisk: 1.0,
  resourceShortage: 0.6,
  accessibilityDifficulty: 0.8,
  vulnerability: 0.4
};
assertEqual(calculatePriorityScore(mixedFactors), 69, 'Mixed factors calculate to exact rounded score 69');
const mixedBreakdown = calculateScoreBreakdown(mixedFactors);
assertEqual(mixedBreakdown.total, 69, 'Score breakdown total matches priority score 69');

// 4. Band thresholds: 84 -> High, 85 -> Critical, 69 -> Medium, 70 -> High, 49 -> Low, 50 -> Medium
console.log('\nTest 4: Band thresholds');
assertEqual(getPriorityBand(85), 'Critical', 'Score 85 is Critical');
assertEqual(getPriorityBand(84), 'High', 'Score 84 is High');
assertEqual(getPriorityBand(70), 'High', 'Score 70 is High');
assertEqual(getPriorityBand(69), 'Medium', 'Score 69 is Medium');
assertEqual(getPriorityBand(50), 'Medium', 'Score 50 is Medium');
assertEqual(getPriorityBand(49), 'Low', 'Score 49 is Low');
assertEqual(getPriorityBand(100), 'Critical', 'Score 100 is Critical');
assertEqual(getPriorityBand(0), 'Low', 'Score 0 is Low');

// 5. Weight validation
console.log('\nTest 5: Weight validation');
const defaultValidation = validateWeights(DEFAULT_PRIORITY_WEIGHTS);
assert(defaultValidation.valid, 'Default priority weights are valid and sum to 1.0');

const invalidWeights = { ...DEFAULT_PRIORITY_WEIGHTS, populationImpact: 0.50 };
const invalidValidation = validateWeights(invalidWeights);
assert(!invalidValidation.valid, 'Weights that sum to != 1.0 are rejected');

// 6. No division by zero in population normalization
console.log('\nTest 6: Division by zero safety in population normalization');
assertEqual(normalizePopulation(1000, 0), 0, 'Zero max population returns 0 without crashing');
assertEqual(normalizePopulation(0, 0), 0, 'Zero population with zero max returns 0');
assertEqual(normalizePopulation(500, null), 0, 'Null max population returns 0');
assertEqual(normalizePopulation(500, -100), 0, 'Negative max population returns 0');
assertEqual(normalizePopulation(2500, 5000), 0.5, 'Normal population returns 0.5');

// 7. Missing population handled safely
console.log('\nTest 7: Missing population handled safely');
assertEqual(normalizePopulation(null, 5000), 0, 'Null population returns 0');
assertEqual(normalizePopulation(undefined, 5000), 0, 'Undefined population returns 0');
assertEqual(normalizePopulation('invalid', 5000), 0, 'String population returns 0');

// 8. Missing medical need handled safely
console.log('\nTest 8: Missing medical need handled safely');
assertEqual(calculateMedicalRisk([]), 0, 'Empty reports return baseline medical risk 0');
assertEqual(calculateMedicalRisk(null), 0, 'Null reports return 0 without error');
assertEqual(calculateMedicalRisk([{ aiAnalysis: null }]), 0, 'Report with null aiAnalysis returns 0');
assertEqual(calculateMedicalRisk([{ aiAnalysis: { medical_need: null } }]), 0, 'Report with medical_need: null returns 0');
assertEqual(calculateMedicalRisk([{ aiAnalysis: { medical_need: true } }]), 0.7, 'Report with medical_need: true returns 0.7');
assertEqual(calculateMedicalRisk([{ aiAnalysis: { red_flags: ['breathing difficulty'] } }]), 1.0, 'Medical emergency red flag returns 1.0');

// 9. Invalid severity handled safely
console.log('\nTest 9: Invalid severity handled safely');
assertEqual(mapSeverityToScore(null), 0, 'Null severity returns 0');
assertEqual(mapSeverityToScore(''), 0, 'Empty severity returns 0');
assertEqual(mapSeverityToScore('catastrophic_unknown'), 0, 'Unknown severity returns 0');
assertEqual(mapSeverityToScore('low'), 0.25, 'Low maps to 0.25');
assertEqual(mapSeverityToScore('Medium'), 0.50, 'Medium maps to 0.50');
assertEqual(mapSeverityToScore('HIGH'), 0.75, 'High maps to 0.75');
assertEqual(mapSeverityToScore('Critical'), 1.00, 'Critical maps to 1.00');

// 10. Explanation does not contain unsupported numbers
console.log('\nTest 10: Explanation generator does not contain unsupported numbers');
const explanationZone = {
  name: 'Zone A',
  priorityBand: 'Critical',
  affectedPopulation: 3842,
  factors: {
    populationImpact: 0.9,
    severity: 1.0,
    medicalRisk: 1.0,
    resourceShortage: 0.8,
    accessibilityDifficulty: 0.95,
    vulnerability: 1.0
  },
  scoreBreakdown: { total: 94 },
  reportCount: 3
};
const explanation = generateScoreExplanation(explanationZone);
console.log(`  Generated Explanation: "${explanation}"`);
assert(explanation.includes('Zone A'), 'Explanation mentions zone name');
assert(explanation.includes('3,842'), 'Explanation mentions only the real population 3,842');
assert(!explanation.includes('18,420'), 'Explanation does not invent region-wide numbers');
assert(explanation.includes('Critical'), 'Explanation reflects computed priority band');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
