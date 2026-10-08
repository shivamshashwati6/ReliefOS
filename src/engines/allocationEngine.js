/**
 * RELIEF-OS Deterministic Resource Allocation Engine
 * 
 * PURE FUNCTION ONLY — ZERO ML, ZERO GEMINI CALLS, ZERO EXTERNAL APIS, ZERO REACT/CONTEXT STATE.
 * 
 * Architecture:
 *   Citizen Reports
 *         ↓
 *   Gemini AI Analysis (Language understanding only)
 *         ↓
 *   Structured Information
 *         ↓
 *   Priority Engine (Zone Priority Score)
 *         ↓
 *   Demand Engine (Resource Demand Needed)
 *         ↓
 *   Allocation Engine (THIS FILE — Deterministic Recommendation)
 *         ↓
 *   Recommended Allocation
 *         ↓
 *   Human Review (Command Center Approval / Simulation)
 *         ↓
 *   Future Dispatch System (Out of scope for this step)
 * 
 * CORE PRINCIPLES:
 * 1. Pure function: calculateAllocation({ zones, inventory, disasterId, options })
 * 2. Deterministic greedy allocation with fairness minimum-coverage safeguard.
 * 3. Never mutates input inventory or zone data.
 * 4. Never creates negative inventory or allocates more than requested.
 * 5. Strict disaster isolation (never cross-mix disasters).
 * 6. Rescue boat special safeguard: never allocate boats when status is "Assessment Required".
 * 7. Explainable templates: deterministic explanations without AI generation.
 */

import { ALLOCATION_PARAMETERS, RESOURCE_METADATA } from '../config/allocationParameters.js';

/**
 * Extracts numeric requested demand and operational status from zone demand definitions.
 * Handles both primitive numbers (demand: { food: 1200 }) and structured objects
 * (demand: { food: { needed: 1200, status: 'Calculated' } }).
 * 
 * @param {string} resourceKey - 'food' | 'water' | 'rescueBoats' | 'medicalTeams'
 * @param {Object} zone - Affected zone record
 * @returns {{ requested: number|null, status: string }}
 */
export function extractResourceDemand(resourceKey, zone) {
  // Check zone.demand?.[resourceKey] or fallback to zone[resourceKey]
  const demandEntry = zone?.demand?.[resourceKey] ?? zone?.[resourceKey];

  if (resourceKey === 'rescueBoats') {
    // Rescue Boat Special Rule (Section 11):
    // Only allocate boats when needed is known. If status is "Assessment Required" or null,
    // do NOT allocate or guess required number of boats.
    if (demandEntry === null || demandEntry === undefined) {
      return { requested: null, status: 'Assessment Required' };
    }
    if (typeof demandEntry === 'number') {
      if (isNaN(demandEntry) || demandEntry < 0) {
        return { requested: null, status: 'Assessment Required' };
      }
      return { requested: Math.floor(demandEntry), status: 'Calculated' };
    }
    if (typeof demandEntry === 'object') {
      if (
        demandEntry.status === 'Assessment Required' ||
        demandEntry.needed === null ||
        demandEntry.needed === undefined
      ) {
        return { requested: null, status: 'Assessment Required' };
      }
      const num = Number(demandEntry.needed);
      if (isNaN(num) || num < 0) {
        return { requested: null, status: 'Assessment Required' };
      }
      return { requested: Math.floor(num), status: demandEntry.status || 'Calculated' };
    }
    return { requested: null, status: 'Assessment Required' };
  }

  // Standard Resources: food, water, medicalTeams
  if (demandEntry === null || demandEntry === undefined) {
    return { requested: 0, status: 'None' };
  }
  if (typeof demandEntry === 'number') {
    return {
      requested: isNaN(demandEntry) ? 0 : Math.max(0, Math.floor(demandEntry)),
      status: 'Calculated',
    };
  }
  if (typeof demandEntry === 'object') {
    const val = demandEntry.needed ?? demandEntry.requested ?? 0;
    const num = Number(val);
    return {
      requested: isNaN(num) ? 0 : Math.max(0, Math.floor(num)),
      status: demandEntry.status || 'Calculated',
    };
  }

  return { requested: 0, status: 'None' };
}

/**
 * Deterministically generates an audit explanation template for an individual zone allocation.
 */
function generateAuditReason({
  zoneName,
  zoneId,
  unit,
  requested,
  allocated,
  remainingNeed,
  priorityScore,
  status,
  initialAvailable,
  totalRequested,
  pass1Allocated,
  pass2Allocated,
}) {
  const name = zoneName || zoneId;

  if (status === 'Assessment Required') {
    return 'Assessment required — stranded population not confirmed. Rescue boats cannot be pre-allocated without verified field counts.';
  }

  if (requested === 0) {
    return `No ${unit} requested for ${name}.`;
  }

  if (allocated === requested) {
    if (pass1Allocated > 0 && pass2Allocated > 0) {
      return `${name} received full allocation (${allocated.toLocaleString()} ${unit}) combining minimum coverage (${pass1Allocated.toLocaleString()}) and priority allocation (${pass2Allocated.toLocaleString()}) based on Priority Score ${priorityScore}.`;
    }
    return `${name} received full allocation (${allocated.toLocaleString()} ${unit}) satisfying 100% of demand based on high Priority Score (${priorityScore}).`;
  }

  if (allocated > 0 && allocated < requested) {
    if (initialAvailable < totalRequested) {
      return `${name} received partial allocation (${allocated.toLocaleString()} of ${requested.toLocaleString()} ${unit}). Available regional inventory (${initialAvailable.toLocaleString()} ${unit}) was insufficient to satisfy total demand (${totalRequested.toLocaleString()} ${unit}). Distributed by priority score ${priorityScore}. Unmet need: ${remainingNeed.toLocaleString()} ${unit}.`;
    }
    return `${name} received partial allocation (${allocated.toLocaleString()} of ${requested.toLocaleString()} ${unit}). Remaining need: ${remainingNeed.toLocaleString()} ${unit}.`;
  }

  if (allocated === 0 && requested > 0) {
    return `Available inventory (${initialAvailable.toLocaleString()} ${unit}) was completely exhausted by higher-priority zones before ${name} could receive resources. Unmet need: ${requested.toLocaleString()} ${unit}.`;
  }

  return `Allocation processed according to Priority Score ${priorityScore}.`;
}

/**
 * PURE MASTER FUNCTION: calculateAllocation
 * 
 * Calculates recommended resource distributions across affected zones.
 * 
 * @param {Object} params
 * @param {Array} params.zones - Array of zone objects
 * @param {Object} params.inventory - Available inventory object (e.g. { food: 2000, water: 1500, rescueBoats: 6, medicalTeams: 2 })
 * @param {string} params.disasterId - Disaster identifier (e.g. 'DISASTER-001')
 * @param {Object} [params.options] - Optional configuration overrides (e.g. { minimumCoverageRatio: 0.20 })
 * 
 * @returns {Object} Structured recommendation results
 */
export function calculateAllocation({ zones = [], inventory = {}, disasterId, options = {} } = {}) {
  const targetDisasterId = disasterId || 'DISASTER-001';

  // Section 3: Disaster Isolation
  // Allocation must ONLY operate on zones belonging to the same disasterId.
  // Never combine Disaster A resources with Disaster B zones.
  const isolatedZones = (zones || []).filter(z => (z.disasterId || 'DISASTER-001') === targetDisasterId);

  // Read configurable minimum coverage ratio (Pass 1 fairness safeguard)
  const minimumCoverageRatio = options.minimumCoverageRatio !== undefined
    ? Number(options.minimumCoverageRatio)
    : ALLOCATION_PARAMETERS.MINIMUM_COVERAGE_RATIO;

  const supportedResources = ALLOCATION_PARAMETERS.SUPPORTED_RESOURCES;

  // Initialize tracking containers
  const allocations = [];
  const remainingInventory = {};
  const unmetDemand = {};
  const totalRequested = {};
  const totalAllocated = {};
  const explanations = [];
  const calculationSteps = {};

  // Process each supported resource independently (Section 10)
  for (const resourceKey of supportedResources) {
    const meta = RESOURCE_METADATA[resourceKey] || {
      id: resourceKey,
      name: resourceKey,
      unit: 'units',
    };

    // Available inventory for this resource (immutable read, floor to integer)
    const initialAvailable = Math.max(0, Math.floor(Number(inventory?.[resourceKey]) || 0));
    let currentStock = initialAvailable;

    // Build zone demand list for this resource
    const zoneDemands = isolatedZones.map(zone => {
      const zoneId = zone.zoneId || zone.id;
      const zoneName = zone.name || zone.fullName || zoneId;
      const priorityScore = typeof zone.priorityScore === 'number' ? zone.priorityScore : 0;
      const priorityBand = zone.priorityBand || 'Medium';

      const { requested, status } = extractResourceDemand(resourceKey, zone);

      return {
        zoneId,
        zoneName,
        disasterId: targetDisasterId,
        priorityScore,
        priorityBand,
        requested,
        status,
        rawZone: zone,
      };
    });

    // Sort zones deterministically (Section 5):
    // 1. Priority score descending (highest priority first)
    // 2. Deterministic tie-breaking: zoneId ascending
    const sortedZones = [...zoneDemands].sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return String(a.zoneId).localeCompare(String(b.zoneId));
    });

    // Tracking for two-pass allocation
    const pass1Map = {};
    const pass2Map = {};
    const pass1Steps = [];
    const pass2Steps = [];

    // Sum of requested demand across valid zones
    let resourceTotalRequested = 0;
    sortedZones.forEach(z => {
      pass1Map[z.zoneId] = 0;
      pass2Map[z.zoneId] = 0;
      if (z.status !== 'Assessment Required' && z.requested !== null) {
        resourceTotalRequested += z.requested;
      }
    });

    // =========================================================================
    // PASS 1: FAIRNESS / MINIMUM COVERAGE SAFEGUARD (Section 8)
    // Before giving additional resources to the highest-priority zone, attempt
    // to provide up to MINIMUM_COVERAGE_RATIO (e.g. 20%) of each zone's demand.
    // If inventory is too small, priority order decides which zones receive it.
    // =========================================================================
    if (minimumCoverageRatio > 0) {
      for (const zone of sortedZones) {
        if (zone.status === 'Assessment Required' || zone.requested === null || zone.requested <= 0) {
          continue;
        }

        const targetMin = Math.min(zone.requested, Math.floor(zone.requested * minimumCoverageRatio));
        const alloc = Math.min(currentStock, targetMin);

        currentStock -= alloc;
        pass1Map[zone.zoneId] = alloc;

        pass1Steps.push({
          zoneId: zone.zoneId,
          priorityScore: zone.priorityScore,
          requested: zone.requested,
          targetMin,
          allocated: alloc,
          stockRemaining: currentStock,
        });
      }
    }

    // =========================================================================
    // PASS 2: PRIORITY GREEDY DISTRIBUTION (Section 5)
    // Distribute remaining resources according to priority score descending.
    // Continue until available resources are exhausted or all demand is satisfied.
    // =========================================================================
    for (const zone of sortedZones) {
      if (zone.status === 'Assessment Required' || zone.requested === null || zone.requested <= 0) {
        continue;
      }

      const alreadyAllocated = pass1Map[zone.zoneId];
      const remainingNeed = zone.requested - alreadyAllocated;
      const alloc = Math.min(currentStock, remainingNeed);

      currentStock -= alloc;
      pass2Map[zone.zoneId] = alloc;

      pass2Steps.push({
        zoneId: zone.zoneId,
        priorityScore: zone.priorityScore,
        remainingNeedBefore: remainingNeed,
        allocated: alloc,
        stockRemaining: currentStock,
      });
    }

    // =========================================================================
    // COMPILE FINAL ALLOCATIONS & AUDIT RECORDS
    // =========================================================================
    let resourceTotalAllocated = 0;
    let resourceUnmetDemand = 0;

    for (const zone of sortedZones) {
      const isAssessmentRequired = zone.status === 'Assessment Required' || zone.requested === null;
      const pass1 = pass1Map[zone.zoneId] || 0;
      const pass2 = pass2Map[zone.zoneId] || 0;
      const allocated = isAssessmentRequired ? 0 : pass1 + pass2;
      const requested = isAssessmentRequired ? null : zone.requested;
      const remainingNeed = isAssessmentRequired ? null : Math.max(0, requested - allocated);

      if (!isAssessmentRequired) {
        resourceTotalAllocated += allocated;
        resourceUnmetDemand += remainingNeed;
      }

      // Operational status badge
      let allocStatus = 'Satisfied';
      if (isAssessmentRequired) {
        allocStatus = 'Assessment Required';
      } else if (requested === 0) {
        allocStatus = 'Zero Demand';
      } else if (allocated === requested) {
        allocStatus = 'Fully Met';
      } else if (allocated > 0) {
        allocStatus = 'Partially Met';
      } else {
        allocStatus = 'Unmet';
      }

      const reason = generateAuditReason({
        zoneName: zone.zoneName,
        zoneId: zone.zoneId,
        unit: meta.unit,
        requested,
        allocated,
        remainingNeed,
        priorityScore: zone.priorityScore,
        status: isAssessmentRequired ? 'Assessment Required' : allocStatus,
        initialAvailable,
        totalRequested: resourceTotalRequested,
        pass1Allocated: pass1,
        pass2Allocated: pass2,
      });

      allocations.push({
        disasterId: targetDisasterId,
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        resource: resourceKey,
        resourceName: meta.name,
        unit: meta.unit,
        requested,
        allocated,
        remainingNeed,
        priorityScore: zone.priorityScore,
        priorityBand: zone.priorityBand,
        status: allocStatus,
        reason,
        pass1Allocated: pass1,
        pass2Allocated: pass2,
      });
    }

    // Set resource-level summary metrics
    remainingInventory[resourceKey] = currentStock;
    unmetDemand[resourceKey] = resourceUnmetDemand;
    totalRequested[resourceKey] = resourceTotalRequested;
    totalAllocated[resourceKey] = resourceTotalAllocated;

    // Structured calculation steps for collapsible calculation drawer (Section 20)
    calculationSteps[resourceKey] = {
      resource: resourceKey,
      resourceName: meta.name,
      unit: meta.unit,
      initialAvailable,
      totalRequested: resourceTotalRequested,
      totalAllocated: resourceTotalAllocated,
      remainingInventory: currentStock,
      unmetDemand: resourceUnmetDemand,
      minimumCoverageRatio,
      priorityOrder: sortedZones.map(z => ({
        zoneId: z.zoneId,
        zoneName: z.zoneName,
        priorityScore: z.priorityScore,
        requested: z.requested,
        status: z.status,
      })),
      pass1Steps,
      pass2Steps,
    };

    // Deterministic summary explanation string (Section 19)
    if (resourceKey === 'rescueBoats') {
      const assessmentCount = sortedZones.filter(z => z.status === 'Assessment Required').length;
      explanations.push(
        `${meta.name}: ${initialAvailable.toLocaleString()} ${meta.unit} available. ${resourceTotalAllocated.toLocaleString()} ${meta.unit} recommended across eligible zones. ${currentStock.toLocaleString()} remaining in reserve. ${assessmentCount > 0 ? `${assessmentCount} zone(s) require field stranded assessment before boat assignment.` : ''}`.trim()
      );
    } else {
      explanations.push(
        `${meta.name}: ${initialAvailable.toLocaleString()} ${meta.unit} available. ${resourceTotalAllocated.toLocaleString()} recommended of ${resourceTotalRequested.toLocaleString()} requested across ${sortedZones.length} zones. Reserve remaining: ${currentStock.toLocaleString()} ${meta.unit}. Unmet demand: ${resourceUnmetDemand.toLocaleString()} ${meta.unit}.`
      );
    }
  }

  // Add fairness safeguard explanation note
  explanations.push(
    `Fairness safeguard: Up to ${(minimumCoverageRatio * 100).toFixed(0)}% minimum coverage was evaluated for eligible zones before distributing remaining inventory according to priority order.`
  );

  return {
    disasterId: targetDisasterId,
    allocations,
    remainingInventory,
    unmetDemand,
    totalRequested,
    totalAllocated,
    explanation: explanations,
    calculationSteps,
  };
}

export default calculateAllocation;
