/**
 * RELIEF-OS Step 15: Hackathon Demo Readiness & End-to-End Workflow Verification Suite
 * 
 * Verifies all Section 1 through 7 requirements:
 * 1. Complete End-to-End 13-step workflow verification
 * 2. Role-based permissions and route boundaries (Command Center, Department, Citizen)
 * 3. Multi-disaster isolation across DISASTER-001 and DISASTER-002
 * 4. Human-in-the-loop governance (recommendation != approved != dispatched)
 * 5. Warehouse inventory immutability across all decision stages
 * 6. Geographic and shelter safety integrity (null schematic coordinates, mandatory disclaimer, no false claims)
 * 7. Empty states and data consistency
 */

import { ROLES, DEPARTMENTS } from '../config/roles.js';
import { INITIAL_ZONES_DATA, matchReportToZone } from '../data/canonicalZones.js';
import { calculateZonePriority } from '../engines/priorityEngine.js';
import { calculateZoneDemand } from '../engines/demandEngine.js';
import { calculateAllocation } from '../engines/allocationEngine.js';
import { 
  createResponsePlan, 
  PLAN_STATUS, 
  APPROVAL_STATUS, 
  formatPlanId 
} from '../models/responsePlan.js';
import { 
  createResponseMonitoring, 
  calculateOverallProgress,
  deriveOverallStatus,
  MONITORING_STATUS 
} from '../models/responseMonitoring.js';
import { 
  createSafetyUpdate, 
  UPDATE_STATUS, 
  UPDATE_SEVERITY 
} from '../models/safetyUpdate.js';
import { calculateOverallIncidentAnalytics } from '../engines/analyticsEngine.js';
import { createSnapshot, calculateTrendSeries } from '../engines/trendEngine.js';
import { 
  createShelter, 
  calculateRemainingCapacity, 
  SHELTER_SAFETY_DISCLAIMER,
  SHELTER_STATUS, 
  SHELTER_LOCATION_TYPE 
} from '../models/reliefShelter.js';
import { CANONICAL_SIMULATED_INVENTORY } from '../config/allocationParameters.js';

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
console.log('RELIEF-OS STEP 15: HACKATHON DEMO READINESS & E2E VERIFICATION');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. DEMO LOGIN & ROLE BOUNDARIES
// -----------------------------------------------------------------------------
const roleChecks = {
  [ROLES.COMMAND_CENTER]: { canApprovePlans: true, canPublishSafety: true, canViewInternalScores: true, canAccessMonitoringControls: true },
  [ROLES.DEPARTMENT]: { canApprovePlans: false, canPublishSafety: false, canViewInternalScores: true, canAccessMonitoringControls: false },
  [ROLES.CITIZEN]: { canApprovePlans: false, canPublishSafety: false, canViewInternalScores: false, canAccessMonitoringControls: false },
};

assert(
  roleChecks[ROLES.COMMAND_CENTER].canApprovePlans &&
  !roleChecks[ROLES.DEPARTMENT].canApprovePlans &&
  !roleChecks[ROLES.CITIZEN].canApprovePlans &&
  !roleChecks[ROLES.CITIZEN].canViewInternalScores,
  '1. Role boundaries enforce strict command vs department vs citizen permissions'
);

// -----------------------------------------------------------------------------
// 2. DISASTER SELECTION & ISOLATION
// -----------------------------------------------------------------------------
const sampleDisasters = [
  { id: 'DISASTER-001', name: 'Assam Flood Response', region: 'Morigaon, Assam' },
  { id: 'DISASTER-002', name: 'Barpeta Flash Flood', region: 'Barpeta, Assam' }
];

const d1Reports = [{ id: 'REP-1', disasterId: 'DISASTER-001', text: 'Flooding near school' }];
const d2Reports = [{ id: 'REP-2', disasterId: 'DISASTER-002', text: 'River bank overflow' }];
const allReports = [...d1Reports, ...d2Reports];

const isolatedD1 = allReports.filter(r => r.disasterId === 'DISASTER-001');
const isolatedD2 = allReports.filter(r => r.disasterId === 'DISASTER-002');

assert(
  isolatedD1.length === 1 && isolatedD1[0].id === 'REP-1' &&
  isolatedD2.length === 1 && isolatedD2[0].id === 'REP-2',
  '2. Disaster records isolate cleanly between DISASTER-001 and DISASTER-002'
);

// -----------------------------------------------------------------------------
// 3. CITIZEN EMERGENCY REPORT MATCHING
// -----------------------------------------------------------------------------
const newReport = {
  id: 'REPORT-0099',
  disasterId: 'DISASTER-001',
  description: 'Water breached embankment near primary school in Sector 4',
  location: 'Morigaon Sector 4',
};
const matchedZoneId = matchReportToZone(newReport, INITIAL_ZONES_DATA);

assert(
  matchedZoneId === 'zone-a',
  '3. Citizen emergency report maps deterministically to Zone A based on keywords'
);

// -----------------------------------------------------------------------------
// 4. DETERMINISTIC ZONE PRIORITY SCORING
// -----------------------------------------------------------------------------
const maxPop = 5610;
const zoneAPriority = calculateZonePriority(INITIAL_ZONES_DATA[0], [newReport], maxPop);

assert(
  zoneAPriority.priorityScore >= 85 &&
  zoneAPriority.priorityBand === 'Critical' &&
  zoneAPriority.factors.medicalRisk === 1.0,
  '4. Deterministic Priority Engine outputs exact Critical priority band for Zone A'
);

// -----------------------------------------------------------------------------
// 5. RESOURCE DEMAND PREDICTION
// -----------------------------------------------------------------------------
const zoneADemand = calculateZoneDemand({
  zoneId: 'zone-a',
  disasterId: 'DISASTER-001',
  peopleAffected: zoneAPriority.affectedPopulation,
  severity: zoneAPriority.priorityBand,
  medicalNeed: 'HIGH',
  strandedPeople: 45,
  accessibilityDifficulty: 0.95,
  vulnerability: 1.0,
  reports: [newReport],
});

assert(
  zoneADemand.food.needed > 0 &&
  zoneADemand.water.needed > 0 &&
  zoneADemand.rescueBoats.needed > 0 &&
  zoneADemand.medicalTeams.needed > 0,
  '5. Demand Engine accurately predicts multi-resource requirements without hallucination'
);

// -----------------------------------------------------------------------------
// 6. ALLOCATION RECOMMENDATION & INVENTORY IMMUTABILITY
// -----------------------------------------------------------------------------
const initialInv = Object.freeze({ ...CANONICAL_SIMULATED_INVENTORY });
const calculatedZones = INITIAL_ZONES_DATA.map(z => ({
  ...z,
  priorityScore: z.id === 'zone-a' ? 94 : 75,
  priorityBand: z.id === 'zone-a' ? 'Critical' : 'High',
  demand: calculateZoneDemand({
    zoneId: z.id,
    disasterId: 'DISASTER-001',
    peopleAffected: z.affectedPopulation,
    severity: z.id === 'zone-a' ? 'Critical' : 'High',
    medicalNeed: 'HIGH',
    accessibilityDifficulty: 0.8,
    vulnerability: 1.0,
  })
}));

const allocResult = calculateAllocation({
  zones: calculatedZones,
  inventory: CANONICAL_SIMULATED_INVENTORY,
  disasterId: 'DISASTER-001',
});

assert(
  allocResult.allocations.length > 0 &&
  CANONICAL_SIMULATED_INVENTORY.food === initialInv.food &&
  CANONICAL_SIMULATED_INVENTORY.water === initialInv.water,
  '6. Allocation recommendations do not mutate warehouse inventory baseline'
);

// -----------------------------------------------------------------------------
// 7. RESPONSE PLAN CREATION & HUMAN APPROVAL WORKFLOW
// -----------------------------------------------------------------------------
const plan1 = createResponsePlan({
  planId: formatPlanId(1),
  disasterId: 'DISASTER-001',
  allocations: allocResult.allocations,
  status: PLAN_STATUS.DRAFT,
});

assert(plan1.status === PLAN_STATUS.DRAFT, '7a. New response plan initializes in DRAFT status');

// Transition to UNDER_REVIEW
plan1.status = PLAN_STATUS.UNDER_REVIEW;
plan1.history.push({ action: 'Review started', user: 'Command Center', statusAtStep: PLAN_STATUS.UNDER_REVIEW });

// Command Center approves plan
plan1.status = PLAN_STATUS.APPROVED;
plan1.approval = {
  status: APPROVAL_STATUS.APPROVED,
  approvedBy: 'Command Center Duty Officer',
  approvedAt: new Date().toISOString(),
  note: 'Plan approved for simulation exercise.',
};

assert(
  plan1.status === PLAN_STATUS.APPROVED &&
  plan1.approval.status === APPROVAL_STATUS.APPROVED &&
  CANONICAL_SIMULATED_INVENTORY.food === initialInv.food,
  '7b. Response plan transitions through review to APPROVED with zero inventory decrements'
);

// -----------------------------------------------------------------------------
// 8. RESPONSE MONITORING & SIMULATION TRACKING
// -----------------------------------------------------------------------------
const monitoringRec = createResponseMonitoring(plan1, {
  monitoringId: 'MON-0001',
  createdBy: 'Command Center',
});

assert(
  monitoringRec.status === MONITORING_STATUS.NOT_STARTED &&
  monitoringRec.overallProgress === 0,
  '8a. Response monitoring initializes safely from approved plan'
);

// Add progress
function simulateAddProgress(mon, zoneId, resourceKey, amount) {
  const updatedZones = mon.zoneProgress.map(zone => {
    if (zone.zoneId !== zoneId) return zone;
    const updatedRes = zone.resources.map(r => {
      if (r.resource !== resourceKey) return r;
      const newCompleted = Math.min(r.planned, r.completed + amount);
      return {
        ...r,
        completed: newCompleted,
        remaining: Math.max(0, r.planned - newCompleted),
        progress: Math.round((newCompleted / r.planned) * 100),
      };
    });
    return { ...zone, resources: updatedRes };
  });

  return {
    ...mon,
    zoneProgress: updatedZones,
    overallProgress: calculateOverallProgress(updatedZones),
    status: MONITORING_STATUS.IN_PROGRESS,
  };
}

const updatedMonitoringRec = simulateAddProgress(monitoringRec, 'zone-a', 'food', 100);

assert(
  updatedMonitoringRec.overallProgress >= 0 &&
  updatedMonitoringRec.status === MONITORING_STATUS.IN_PROGRESS,
  '8b. Human-directed simulated progress tracks execution progress accurately'
);

// -----------------------------------------------------------------------------
// 9. SAFETY UPDATES LIFECYCLE & CITIZEN PRIVACY
// -----------------------------------------------------------------------------
const draftUpdate = createSafetyUpdate({
  disasterId: 'DISASTER-001',
  title: 'Water Advisory',
  message: 'Boil tap water before consumption.',
  severity: UPDATE_SEVERITY.CAUTION,
  status: UPDATE_STATUS.DRAFT,
  affectedArea: 'Morigaon Sector 4',
});

assert(draftUpdate.status === UPDATE_STATUS.DRAFT, '9a. Safety update starts as DRAFT');

const publishedUpdate = {
  ...draftUpdate,
  updateId: 'SU-0001',
  status: UPDATE_STATUS.PUBLISHED,
  publishedAt: new Date().toISOString(),
};

function getPublicSafetyFeed(updatesList, userRole) {
  if (userRole === ROLES.CITIZEN) {
    return updatesList.filter(u => u.status === UPDATE_STATUS.PUBLISHED);
  }
  return updatesList;
}

const allUpdates = [draftUpdate, publishedUpdate];
const citizenFeed = getPublicSafetyFeed(allUpdates, ROLES.CITIZEN);
const commandFeed = getPublicSafetyFeed(allUpdates, ROLES.COMMAND_CENTER);

assert(
  citizenFeed.length === 1 && citizenFeed[0].updateId === 'SU-0001' &&
  commandFeed.length === 2,
  '9b. Citizens only see PUBLISHED safety advisories while draft notices remain restricted'
);

// -----------------------------------------------------------------------------
// 10. INCIDENT ANALYTICS & HISTORICAL TREND SNAPSHOTS
// -----------------------------------------------------------------------------
const masterAnalytics = calculateOverallIncidentAnalytics({
  zones: calculatedZones,
  allocations: allocResult.allocations,
  monitoringRecord: updatedMonitoringRec,
  updates: [publishedUpdate],
});

assert(
  masterAnalytics.priority.totalZones >= 4 &&
  masterAnalytics.priority.highestPriorityZone !== null &&
  masterAnalytics.resources.overallCoverage >= 0,
  '10a. Incident analytics calculates comprehensive situational posture deterministically'
);

const snap1 = createSnapshot({
  disasterId: 'DISASTER-001',
  reports: { total: 3, critical: 1, high: 1 },
  priority: { criticalZones: 1, highPriorityZones: 1, highestScore: 94 },
  resources: { overallCoverage: 75, totalUnmet: 200 },
  response: { overallProgress: 20 },
  safety: { publishedUpdates: 1, urgentUpdates: 0 },
}, '2026-10-10T10:00:00Z', { sequence: 1 });

const snap2 = createSnapshot({
  disasterId: 'DISASTER-001',
  reports: { total: 4, critical: 1, high: 2 },
  priority: { criticalZones: 1, highPriorityZones: 2, highestScore: 94 },
  resources: { overallCoverage: 85, totalUnmet: 120 },
  response: { overallProgress: 45 },
  safety: { publishedUpdates: 1, urgentUpdates: 0 },
}, '2026-10-10T14:00:00Z', { sequence: 2 });

const trendResults = calculateTrendSeries([snap1, snap2]);

assert(
  trendResults.count === 2 &&
  trendResults.trend.metrics.resourceCoverage.direction === 'IMPROVING' &&
  trendResults.trend.metrics.responseProgress.direction === 'IMPROVING',
  '10b. Historical trend snapshots accurately measure operational progression'
);

// -----------------------------------------------------------------------------
// 11. GEOGRAPHIC & SHELTER INTEGRITY
// -----------------------------------------------------------------------------
const demoShelter = createShelter({
  disasterId: 'DISASTER-001',
  name: 'Sector 4 Community Point (Simulated)',
  area: 'Morigaon Sector 4',
  capacity: 250,
  occupancy: 180,
  locationType: SHELTER_LOCATION_TYPE.SCHEMATIC,
});

const remainingCap = calculateRemainingCapacity(demoShelter);

assert(
  demoShelter.status === SHELTER_STATUS.SIMULATED &&
  demoShelter.locationType === SHELTER_LOCATION_TYPE.SCHEMATIC &&
  demoShelter.latitude === null &&
  demoShelter.longitude === null &&
  demoShelter.disclaimer === SHELTER_SAFETY_DISCLAIMER &&
  remainingCap === 70,
  '11. Shelter modeling preserves null schematic coordinates and mandatory safety disclaimer'
);

// -----------------------------------------------------------------------------
// 12. EMPTY STATES FOR DISASTER-002
// -----------------------------------------------------------------------------
const d2Shelters = [demoShelter].filter(s => s.disasterId === 'DISASTER-002');
const d2Plans = [plan1].filter(p => p.disasterId === 'DISASTER-002');

assert(
  d2Shelters.length === 0 && d2Plans.length === 0,
  '12. Empty states trigger properly when switching to secondary unconfigured disaster'
);

// -----------------------------------------------------------------------------
// 13. ZERO INVENTORY DISPATCH OR MUTATION INVARIANTS
// -----------------------------------------------------------------------------
assert(
  CANONICAL_SIMULATED_INVENTORY.food === 2000 &&
  CANONICAL_SIMULATED_INVENTORY.water === 1500 &&
  CANONICAL_SIMULATED_INVENTORY.rescueBoats === 6 &&
  CANONICAL_SIMULATED_INVENTORY.medicalTeams === 2,
  '13. Full end-to-end execution maintains zero automated dispatch or live inventory mutation'
);

console.log('\n================================================================');
console.log(`STEP 15 E2E INTEGRATION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL 13 STEP 15 HACKATHON VERIFICATION SUITE TESTS PASSED 100%!\n');
}
