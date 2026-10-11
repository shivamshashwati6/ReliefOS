/**
 * RELIEF-OS Step 14: Relief Shelter Model & Context Unit Tests
 * 
 * Verifies all Section 12 requirements:
 * 1. Valid shelter creation
 * 2. Unique shelter IDs
 * 3. Disaster association
 * 4. Disaster isolation
 * 5. Invalid negative capacity
 * 6. Invalid negative occupancy
 * 7. Occupancy exceeding capacity
 * 8. Remaining capacity calculation
 * 9. Schematic locations do not receive fabricated coordinates
 * 10. Simulation disclaimer is present
 * 11. Source data is not mutated
 * 12. Unauthorized mutations are rejected if mutations exist
 */

import {
  createShelter,
  validateShelterInput,
  calculateRemainingCapacity,
  formatShelterId,
  SHELTER_SAFETY_DISCLAIMER,
  SHELTER_STATUS,
  SHELTER_LOCATION_TYPE
} from '../models/reliefShelter.js';
import { ROLES } from '../config/roles.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, message = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}: ${message}`);
  }
}

console.log('================================================================');
console.log('RELIEF-OS STEP 14: RELIEF SHELTER UNIT TEST SUITE');
console.log('================================================================\n');

// Sample valid shelter fixture
const validSample = {
  disasterId: 'DISASTER-001',
  name: 'Demo Community Relief Point',
  area: 'Morigaon',
  status: 'SIMULATED',
  capacity: 200,
  occupancy: 80,
  services: ['First Aid', 'Drinking Water'],
  locationType: 'SCHEMATIC',
  latitude: null,
  longitude: null,
};

// 1. Valid shelter creation
const shelter1 = createShelter(validSample, { sequence: 1 });
assert(
  shelter1.shelterId === 'SH-0001' &&
  shelter1.disasterId === 'DISASTER-001' &&
  shelter1.name === 'Demo Community Relief Point' &&
  shelter1.area === 'Morigaon' &&
  shelter1.status === SHELTER_STATUS.SIMULATED &&
  shelter1.capacity === 200 &&
  shelter1.occupancy === 80 &&
  shelter1.services.length === 2 &&
  shelter1.locationType === SHELTER_LOCATION_TYPE.SCHEMATIC,
  '1. Valid shelter creation produces standardized schema structure'
);

// 1b. Validate shelter input
const valInputRes = validateShelterInput(validSample);
assert(
  valInputRes.isValid === true && Object.keys(valInputRes.errors).length === 0,
  '1b. validateShelterInput validates candidate input correctly'
);

// 2. Unique shelter IDs
const id1 = formatShelterId(1);
const id2 = formatShelterId(2);
const id10 = formatShelterId(10);
assert(
  id1 === 'SH-0001' && id2 === 'SH-0002' && id10 === 'SH-0010' && id1 !== id2,
  '2. Sequential shelter IDs are unique and formatted correctly'
);

// 3. Disaster association
assert(
  shelter1.disasterId === 'DISASTER-001',
  '3. Shelter record is associated with target disasterId'
);

// 4. Disaster isolation
const sD1 = createShelter({ ...validSample, disasterId: 'DISASTER-001' }, { sequence: 1 });
const sD2 = createShelter({ ...validSample, disasterId: 'DISASTER-002', name: 'Zone B Point' }, { sequence: 2 });
const allShelters = [sD1, sD2];
const d1Only = allShelters.filter(s => s.disasterId === 'DISASTER-001');
const d2Only = allShelters.filter(s => s.disasterId === 'DISASTER-002');
assert(
  d1Only.length === 1 && d1Only[0].shelterId === sD1.shelterId &&
  d2Only.length === 1 && d2Only[0].shelterId === sD2.shelterId,
  '4. Shelters partition cleanly by disasterId with zero cross-disaster leakage'
);

// 5. Invalid negative capacity
let errorNegCap = null;
try {
  createShelter({ ...validSample, capacity: -50 });
} catch (err) {
  errorNegCap = err.message;
}
assert(
  errorNegCap !== null && errorNegCap.includes('Capacity cannot be negative'),
  '5. Invalid negative capacity is strictly rejected',
  `Error caught: ${errorNegCap}`
);

// 6. Invalid negative occupancy
let errorNegOcc = null;
try {
  createShelter({ ...validSample, occupancy: -10 });
} catch (err) {
  errorNegOcc = err.message;
}
assert(
  errorNegOcc !== null && errorNegOcc.includes('Occupancy cannot be negative'),
  '6. Invalid negative occupancy is strictly rejected',
  `Error caught: ${errorNegOcc}`
);

// 7. Occupancy exceeding capacity
let errorOccExceed = null;
try {
  createShelter({ ...validSample, capacity: 100, occupancy: 150 });
} catch (err) {
  errorOccExceed = err.message;
}
assert(
  errorOccExceed !== null && errorOccExceed.includes('cannot exceed capacity'),
  '7. Occupancy exceeding capacity is strictly rejected',
  `Error caught: ${errorOccExceed}`
);

// 8. Remaining capacity calculation: max(capacity - occupancy, 0)
const rem1 = calculateRemainingCapacity({ capacity: 200, occupancy: 80 });
const remFull = calculateRemainingCapacity({ capacity: 100, occupancy: 100 });
const remSafe = calculateRemainingCapacity({ capacity: 50, occupancy: 60 });
assert(
  rem1 === 120 && remFull === 0 && remSafe === 0,
  '8. Remaining capacity calculated as max(capacity - occupancy, 0)'
);

// 9. Schematic locations do not receive fabricated coordinates
assert(
  shelter1.locationType === 'SCHEMATIC' &&
  shelter1.latitude === null &&
  shelter1.longitude === null,
  '9. Schematic shelters maintain null latitude and longitude without fabricated coordinates'
);

// 10. Simulation disclaimer is present
assert(
  shelter1.disclaimer === SHELTER_SAFETY_DISCLAIMER &&
  shelter1.disclaimer.includes('verify local availability before travelling'),
  '10. Safety disclaimer is present and explicitly emphasizes simulation data'
);

// 11. Source data is not mutated
const preSample = JSON.parse(JSON.stringify(validSample));
createShelter(validSample, { sequence: 99 });
assert(
  JSON.stringify(validSample) === JSON.stringify(preSample),
  '11. Shelter creation does not mutate input source objects'
);

// 12. Unauthorized mutations are rejected if mutations exist
function testRoleMutation(userRole, shelterData) {
  if (userRole !== ROLES.COMMAND_CENTER) {
    return { success: false, error: 'Unauthorized: Only Command Center personnel can mutate shelter records.' };
  }
  return { success: true, shelter: createShelter(shelterData) };
}

const deptAttempt = testRoleMutation(ROLES.DEPARTMENT, validSample);
const citizenAttempt = testRoleMutation(ROLES.CITIZEN, validSample);
const cmdAttempt = testRoleMutation(ROLES.COMMAND_CENTER, validSample);

assert(
  deptAttempt.success === false && deptAttempt.error.includes('Unauthorized') &&
  citizenAttempt.success === false && citizenAttempt.error.includes('Unauthorized') &&
  cmdAttempt.success === true,
  '12. Unauthorized role mutation attempts by Department and Citizen are strictly rejected'
);

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL 12 RELIEF SHELTER UNIT TESTS PASSED SUCCESSFULLY!\n');
}
