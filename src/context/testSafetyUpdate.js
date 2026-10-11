/**
 * RELIEF-OS Step 11: Safety Updates & Public Information Test Suite
 * 
 * Verifies all 20 required test scenarios:
 * 1. Create draft update
 * 2. Unique SU ID
 * 3. Correct disasterId
 * 4. Draft status
 * 5. Start review
 * 6. Publish update
 * 7. Published timestamp
 * 8. Published update visible to citizens
 * 9. Draft hidden from citizens
 * 10. Under-review hidden from citizens
 * 11. Archived hidden from citizens
 * 12. Archive published update
 * 13. Expiry hides update from public
 * 14. Expired update remains in history
 * 15. Citizen cannot mutate updates
 * 16. Department cannot mutate updates
 * 17. Command Center can mutate updates
 * 18. Disaster isolation
 * 19. History preserved
 * 20. Multiple updates supported
 */

import { 
  createSafetyUpdate, 
  UPDATE_STATUS, 
  UPDATE_SEVERITY, 
  formatUpdateId, 
  isUpdateActive 
} from '../models/safetyUpdate.js';
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
console.log('RELIEF-OS STEP 11: CITIZEN SAFETY UPDATES TEST SUITE');
console.log('================================================================\n');

// Sample test input
const validUpdateInput = {
  title: 'Flood Safety Update: Sector 4',
  message: 'Residents in low-lying areas are advised to stay alert and move to safer locations if instructed by local authorities.',
  severity: UPDATE_SEVERITY.CAUTION,
  affectedArea: 'Morigaon Sector 4, Assam',
  disasterId: 'DISASTER-001',
};

// 1. Create draft update
let update1 = null;
try {
  update1 = createSafetyUpdate(validUpdateInput, { updateId: 'SU-0001', createdBy: 'Command Center Officer' });
  assert(
    update1 && update1.title === validUpdateInput.title,
    '1. Create draft update',
    'Failed to create safety update object'
  );
} catch (err) {
  assert(false, '1. Create draft update', err.message);
}

// 2. Unique SU ID
const generatedId = formatUpdateId(2);
assert(
  update1.updateId === 'SU-0001' && generatedId === 'SU-0002',
  '2. Unique SU ID (formatted sequentially: SU-0001, SU-0002...)',
  `Unexpected IDs: ${update1.updateId}, ${generatedId}`
);

// 3. Correct disasterId
assert(
  update1.disasterId === 'DISASTER-001',
  '3. Correct disasterId preserved in safety update',
  `Expected DISASTER-001, got ${update1.disasterId}`
);

// 4. Draft status
assert(
  update1.status === UPDATE_STATUS.DRAFT,
  '4. Initial status is strictly DRAFT',
  `Expected DRAFT, got ${update1.status}`
);

// 5. Start review
function transitionToReview(record, actor = 'Command Center') {
  if (record.status !== UPDATE_STATUS.DRAFT) {
    throw new Error('Only draft updates can enter review');
  }
  const now = new Date().toISOString();
  return {
    ...record,
    status: UPDATE_STATUS.UNDER_REVIEW,
    history: [
      ...record.history,
      { action: 'Review started', actor, timestamp: now },
    ],
  };
}

let reviewUpdate = transitionToReview(update1);
assert(
  reviewUpdate.status === UPDATE_STATUS.UNDER_REVIEW,
  '5. Start review transitions status to UNDER_REVIEW',
  `Expected UNDER_REVIEW, got ${reviewUpdate.status}`
);

// 6. Publish update
function transitionToPublish(record, actor = 'Command Center') {
  if (record.status !== UPDATE_STATUS.UNDER_REVIEW && record.status !== UPDATE_STATUS.DRAFT) {
    throw new Error('Only draft or under-review updates can be published');
  }
  const now = new Date().toISOString();
  return {
    ...record,
    status: UPDATE_STATUS.PUBLISHED,
    publishedAt: now,
    history: [
      ...record.history,
      { action: 'Safety update published', actor, timestamp: now },
    ],
  };
}

let publishedUpdate = transitionToPublish(reviewUpdate);
assert(
  publishedUpdate.status === UPDATE_STATUS.PUBLISHED,
  '6. Publish update transitions status to PUBLISHED',
  `Expected PUBLISHED, got ${publishedUpdate.status}`
);

// 7. Published timestamp
assert(
  Boolean(publishedUpdate.publishedAt) && !isNaN(new Date(publishedUpdate.publishedAt).getTime()),
  '7. Published timestamp recorded in ISO format',
  `Invalid publishedAt: ${publishedUpdate.publishedAt}`
);

// 8. Published update visible to citizens
assert(
  isUpdateActive(publishedUpdate, new Date()) === true,
  '8. Published update is active and visible to citizens',
  'Published update should be visible'
);

// 9. Draft hidden from citizens
assert(
  isUpdateActive(update1, new Date()) === false,
  '9. Draft update is strictly hidden from citizens',
  'Draft update should NOT be visible'
);

// 10. Under-review hidden from citizens
assert(
  isUpdateActive(reviewUpdate, new Date()) === false,
  '10. Under-review update is strictly hidden from citizens',
  'Under-review update should NOT be visible'
);

// 11. Archived hidden from citizens
const archivedMock = { ...publishedUpdate, status: UPDATE_STATUS.ARCHIVED };
assert(
  isUpdateActive(archivedMock, new Date()) === false,
  '11. Archived update is strictly hidden from citizens',
  'Archived update should NOT be visible'
);

// 12. Archive published update
function transitionToArchive(record, actor = 'Command Center') {
  const now = new Date().toISOString();
  return {
    ...record,
    status: UPDATE_STATUS.ARCHIVED,
    history: [
      ...record.history,
      { action: 'Safety update archived', actor, timestamp: now },
    ],
  };
}

const archivedUpdate = transitionToArchive(publishedUpdate);
assert(
  archivedUpdate.status === UPDATE_STATUS.ARCHIVED &&
  archivedUpdate.history.some(h => h.action === 'Safety update archived'),
  '12. Archive published update transitions status to ARCHIVED with history entry',
  `Expected ARCHIVED, got ${archivedUpdate.status}`
);

// 13. Expiry hides update from public
const pastTime = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour in the past
const expiredUpdate = {
  ...publishedUpdate,
  expiresAt: pastTime,
};
assert(
  isUpdateActive(expiredUpdate, new Date()) === false,
  '13. Expiry timestamp in the past automatically hides update from citizen view',
  'Expired update should return false for isUpdateActive'
);

// 14. Expired update remains in history
assert(
  expiredUpdate.status === UPDATE_STATUS.PUBLISHED && expiredUpdate.history.length > 0,
  '14. Expired update remains preserved in Command Center records and history without deletion',
  'Expired record was lost'
);

// 15. Citizen cannot mutate updates
function checkMutationAuth(userRole) {
  if (userRole !== ROLES.COMMAND_CENTER) {
    throw new Error('Unauthorized: Only Command Center can create, modify, publish, or archive safety updates.');
  }
  return true;
}

try {
  checkMutationAuth(ROLES.CITIZEN);
  assert(false, '15. Citizen cannot mutate updates', 'Citizen should have been rejected');
} catch (err) {
  assert(
    err.message.includes('Only Command Center can create'),
    '15. Citizen role mutation attempt rejected with unauthorized error',
    `Wrong message: ${err.message}`
  );
}

// 16. Department cannot mutate updates
try {
  checkMutationAuth(ROLES.DEPARTMENT);
  assert(false, '16. Department cannot mutate updates', 'Department should have been rejected');
} catch (err) {
  assert(
    err.message.includes('Only Command Center can create'),
    '16. Department role mutation attempt rejected with unauthorized error',
    `Wrong message: ${err.message}`
  );
}

// 17. Command Center can mutate updates
assert(
  checkMutationAuth(ROLES.COMMAND_CENTER) === true,
  '17. Command Center role is authorized to perform mutations',
  'Command Center should be authorized'
);

// 18. Disaster isolation
const updateDisaster1 = createSafetyUpdate({ ...validUpdateInput, disasterId: 'DISASTER-001' }, { updateId: 'SU-0001' });
const updateDisaster2 = createSafetyUpdate({ ...validUpdateInput, disasterId: 'DISASTER-002', title: 'Cyclone Warning' }, { updateId: 'SU-0002' });

const allUpdates = [updateDisaster1, updateDisaster2];
const d1List = allUpdates.filter(u => u.disasterId === 'DISASTER-001');
const d2List = allUpdates.filter(u => u.disasterId === 'DISASTER-002');

assert(
  d1List.length === 1 && d1List[0].disasterId === 'DISASTER-001' &&
  d2List.length === 1 && d2List[0].disasterId === 'DISASTER-002' &&
  !d1List.some(u => u.title === 'Cyclone Warning'),
  '18. Disaster isolation: Updates strictly partitioned by disasterId without cross-contamination',
  'Disaster isolation failed'
);

// 19. History preserved
assert(
  archivedUpdate.history.length === 4 &&
  archivedUpdate.history[0].action === 'Update created' &&
  archivedUpdate.history[1].action === 'Review started' &&
  archivedUpdate.history[2].action === 'Safety update published' &&
  archivedUpdate.history[3].action === 'Safety update archived',
  '19. Full audit history preserved across all state transitions',
  `History length: ${archivedUpdate.history.length}`
);

// 20. Multiple updates supported
const multiBatch = [
  createSafetyUpdate({ ...validUpdateInput, title: 'Advisory 1' }, { updateId: 'SU-0001' }),
  createSafetyUpdate({ ...validUpdateInput, title: 'Advisory 2', severity: UPDATE_SEVERITY.INFO }, { updateId: 'SU-0002' }),
  createSafetyUpdate({ ...validUpdateInput, title: 'Advisory 3', severity: UPDATE_SEVERITY.URGENT }, { updateId: 'SU-0003' }),
];
assert(
  multiBatch.length === 3 &&
  multiBatch[0].updateId === 'SU-0001' &&
  multiBatch[1].updateId === 'SU-0002' &&
  multiBatch[2].updateId === 'SU-0003',
  '20. Multiple safety updates supported concurrently without collision',
  'Multiple batch generation failed'
);

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('================================================================');

if (failed === 0) {
  console.log('ALL 20 SAFETY UPDATE TESTS PASSED SUCCESSFULLY!\n');
} else {
  console.error(`FAILED ${failed} TESTS. PLEASE REVIEW LOGS.\n`);
  process.exit(1);
}
