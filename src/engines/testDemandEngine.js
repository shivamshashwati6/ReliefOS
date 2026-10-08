/**
 * RELIEF-OS Demand Engine Test Suite
 * Validates Section 20 for the Deterministic Resource Demand Engine.
 */

import {
  calculateFoodDemand,
  calculateWaterDemand,
  calculateRescueDemand,
  calculateMedicalTeamDemand,
  calculateMedicineDemand,
  calculateGap,
  calculateZoneDemand,
  getSeverityModifier,
  getSituationAdjustment,
} from './demandEngine.js';

import { DEMAND_PARAMETERS } from '../config/demandParameters.js';

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
console.log('RELIEF-OS DETERMINISTIC DEMAND ENGINE TEST SUITE');
console.log('====================================================\n');

// 1. Normal food demand
// Formula: 3,842 people * 0.6 kits/person/day * 3 days = 6,915.6 -> 6,916 kits
console.log('Test 1: Normal food demand');
const foodDemand = calculateFoodDemand(3842);
assertEqual(foodDemand, 6916, 'Normal food demand for 3,842 people across 3 days');

// 2. Normal water demand
// Formula: 3,842 people * 1.2 units/person/day * 3 days = 13,831.2 -> 13,831 units
console.log('Test 2: Normal water demand');
const waterDemand = calculateWaterDemand(3842);
assertEqual(waterDemand, 13831, 'Normal water demand for 3,842 people across 3 days');

// 3. Rescue boat calculation (exact division)
// 30 people / 15 per boat = 2 boats
console.log('Test 3: Rescue boat calculation (exact division)');
const boatExact = calculateRescueDemand(30);
assertEqual(boatExact.needed, 2, '30 people needing rescue / 15 boat capacity = 2 boats');
assertEqual(boatExact.status, 'Active Rescue Required', 'Status is Active Rescue Required');

// 4. Math.ceil rescue boat calculation
// 45 people / 15 = 3 boats; 46 people / 15 = 3.067 -> 4 boats
console.log('Test 4: Math.ceil rescue boat calculation');
const boatCeil45 = calculateRescueDemand(45);
assertEqual(boatCeil45.needed, 3, '45 people / 15 per boat = 3 boats');
const boatCeil46 = calculateRescueDemand(46);
assertEqual(boatCeil46.needed, 4, '46 people / 15 per boat = 4 boats (Math.ceil)');

// 5. Missing rescue information
console.log('Test 5: Missing rescue information');
const boatNull = calculateRescueDemand(null);
assertEqual(boatNull.needed, null, 'Null stranded count returns needed: null');
assertEqual(boatNull.status, 'Assessment Required', 'Null stranded count returns Assessment Required');
const boatUndefined = calculateRescueDemand(undefined);
assertEqual(boatUndefined.needed, null, 'Undefined stranded count returns needed: null');

// 6. Medical team calculation (base without medical need)
// 3,842 people / 1000 = Math.ceil(3.842) = 4 teams
console.log('Test 6: Medical team calculation (base)');
const medBase = calculateMedicalTeamDemand(3842, 'NONE');
assertEqual(medBase, 4, 'Base medical teams for 3,842 people is 4 teams');

// 7. High medical need
// 4 base teams + 1 high medical need adjustment = 5 teams
console.log('Test 7: High medical need adjustment');
const medHigh = calculateMedicalTeamDemand(3842, 'HIGH');
assertEqual(medHigh, 5, 'Base 4 + 1 high medical need adjustment = 5 teams');

// 8. Critical medical need
// 4 base teams + 2 critical medical need adjustment = 6 teams
console.log('Test 8: Critical medical need adjustment');
const medCritical = calculateMedicalTeamDemand(3842, 'CRITICAL');
assertEqual(medCritical, 6, 'Base 4 + 2 critical medical need adjustment = 6 teams');

// 9. Severity modifier
// Food base: 6916 * 1.3 (Critical severity modifier) = 8990.28 -> 8990
console.log('Test 9: Severity modifier');
assertEqual(getSeverityModifier('CRITICAL'), 1.3, 'Critical severity modifier is 1.3');
assertEqual(getSeverityModifier('LOW'), 1.0, 'Low severity modifier is 1.0');
const foodWithSeverity = calculateFoodDemand(3842, { applySeverityModifier: true, severity: 'CRITICAL' });
assertEqual(foodWithSeverity, 8990, 'Food demand with Critical severity modifier');

// 10. Accessibility / Situation adjustment
console.log('Test 10: Accessibility / Situation adjustment');
assertEqual(getSituationAdjustment('VERY_DIFFICULT'), 1.2, 'Very difficult accessibility adjustment is 1.2');
assertEqual(getSituationAdjustment('EASY'), 1.0, 'Easy accessibility adjustment is 1.0');
const foodWithAdjustment = calculateFoodDemand(3842, { applySituationAdjustment: true, accessibility: 'VERY_DIFFICULT' });
assertEqual(foodWithAdjustment, 8299, 'Food demand with 1.2 situation adjustment');

// 11. Gap calculation
// Needed 1,200, Available 500 -> Gap = 700
console.log('Test 11: Gap calculation');
const gapNormal = calculateGap(1200, 500);
assertEqual(gapNormal, 700, 'Needed 1,200, Available 500 -> Gap is 700');

// 12. No negative gap
// Needed 200, Available 500 -> Gap = 0 (never negative)
console.log('Test 12: No negative gap');
const gapSurplus = calculateGap(200, 500);
assertEqual(gapSurplus, 0, 'Needed 200, Available 500 -> Gap is 0');
const gapZero = calculateGap(0, 100);
assertEqual(gapZero, 0, 'Needed 0, Available 100 -> Gap is 0');

// 13. Zero affected population
console.log('Test 13: Zero affected population');
const zeroFood = calculateFoodDemand(0);
assertEqual(zeroFood, 0, 'Zero population produces 0 food demand');
const zeroWater = calculateWaterDemand(0);
assertEqual(zeroWater, 0, 'Zero population produces 0 water demand');
const zeroMed = calculateMedicalTeamDemand(0, 'CRITICAL');
assertEqual(zeroMed, 0, 'Zero population produces 0 medical teams even if critical');

// 14. Missing optional fields
console.log('Test 14: Missing optional fields handled safely');
const missingFieldsDemand = calculateZoneDemand({
  zoneId: 'test-zone',
  disasterId: 'DISASTER-NEW',
  peopleAffected: 2000,
}, { useCanonicalDemoOverride: false });
assert(missingFieldsDemand.food.needed > 0, 'Missing fields still calculates food demand');
assert(missingFieldsDemand.water.needed > 0, 'Missing fields still calculates water demand');
assertEqual(missingFieldsDemand.rescueBoats.needed, null, 'Missing stranded count defaults to null');
assertEqual(missingFieldsDemand.rescueBoats.status, 'Assessment Required', 'Status is Assessment Required');
assert(missingFieldsDemand.medicalTeams.needed >= 2, 'Medical teams computed safely');
assert(missingFieldsDemand.explanation.food.includes('2,000 people'), 'Explanation generated accurately');

// 15. Disaster isolation
console.log('Test 15: Disaster isolation');
const disasterA = calculateZoneDemand({
  zoneId: 'zone-a',
  disasterId: 'DISASTER-A',
  peopleAffected: 1000,
}, { useCanonicalDemoOverride: false });

const disasterB = calculateZoneDemand({
  zoneId: 'zone-a',
  disasterId: 'DISASTER-B',
  peopleAffected: 5000,
}, { useCanonicalDemoOverride: false });

assertEqual(disasterA.disasterId, 'DISASTER-A', 'Disaster A retains its disaster ID');
assertEqual(disasterB.disasterId, 'DISASTER-B', 'Disaster B retains its disaster ID');
assertEqual(disasterA.food.needed, 1800, 'Disaster A food (1000 * 0.6 * 3) = 1,800');
assertEqual(disasterB.food.needed, 9000, 'Disaster B food (5000 * 0.6 * 3) = 9,000');
assert(disasterA.food.needed !== disasterB.food.needed, 'Disasters calculate independently with no cross-leakage');

// 16. Canonical demo data preservation
console.log('Test 16: Canonical demo data preservation');
const canonicalZoneA = calculateZoneDemand({
  zoneId: 'zone-a',
  disasterId: 'DISASTER-001',
  peopleAffected: 3842,
  strandedPeople: 45,
});

assertEqual(canonicalZoneA.isCanonicalDemo, true, 'Zone A in DISASTER-001 identified as canonical demo');
assertEqual(canonicalZoneA.food.needed, 1200, 'Canonical Zone A food needed is preserved as 1,200 kits');
assertEqual(canonicalZoneA.food.available, 500, 'Canonical Zone A food available is 500');
assertEqual(canonicalZoneA.food.gap, 700, 'Canonical Zone A food gap is 700');
assertEqual(canonicalZoneA.water.needed, 800, 'Canonical Zone A water needed is preserved as 800 units');
assertEqual(canonicalZoneA.water.available, 300, 'Canonical Zone A water available is 300');
assertEqual(canonicalZoneA.water.gap, 500, 'Canonical Zone A water gap is 500');
assertEqual(canonicalZoneA.rescueBoats.needed, 4, 'Canonical Zone A rescue boats needed is preserved as 4');
assertEqual(canonicalZoneA.rescueBoats.available, 1, 'Canonical Zone A rescue boats available is 1');
assertEqual(canonicalZoneA.rescueBoats.gap, 3, 'Canonical Zone A rescue boats gap is 3');
assertEqual(canonicalZoneA.medicalTeams.needed, 1, 'Canonical Zone A medical team needed is preserved as 1');
assertEqual(canonicalZoneA.medicalTeams.available, 0, 'Canonical Zone A medical team available is 0');
assertEqual(canonicalZoneA.medicalTeams.gap, 1, 'Canonical Zone A medical team gap is 1');
assertEqual(canonicalZoneA.medicine.level, 'HIGH', 'Canonical Zone A medicine demand is HIGH');

// Also verify formula values are transparently accessible alongside canonical values
assertEqual(canonicalZoneA.food.formulaNeeded, 6916, 'Underlying formula food (6,916) is accessible in formulaNeeded');
assertEqual(canonicalZoneA.water.formulaNeeded, 13831, 'Underlying formula water (13,831) is accessible in formulaNeeded');
assertEqual(canonicalZoneA.rescueBoats.formulaNeeded, 3, 'Underlying formula boats (3) is accessible in formulaNeeded');
assertEqual(canonicalZoneA.medicalTeams.formulaNeeded, 5, 'Underlying formula teams (5) is accessible in formulaNeeded');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
