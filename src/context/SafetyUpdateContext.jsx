/**
 * RELIEF-OS Safety Update Context
 * 
 * Manages public-facing safety notices and advisories created by the Command Center.
 * 
 * STRICT ARCHITECTURAL PRINCIPLES:
 * 1. STRICT SEPARATION OF CONCERNS:
 *    - Internal allocations, priority numbers, and engine calculations are NEVER exposed.
 *    - Citizens and Departments receive only verified, human-approved safety information.
 * 2. ROLE SECURITY:
 *    - ONLY Command Center can create, edit, review, publish, and archive safety updates.
 *    - Citizens & Departments have strictly read-only access.
 * 3. PUBLISHED-ONLY PUBLIC VISIBILITY:
 *    - Citizens see ONLY updates with status === 'PUBLISHED' and non-expired timestamps.
 * 4. DISASTER ISOLATION:
 *    - Updates are strictly scoped by disasterId without cross-disaster leakage.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useDisaster } from './DisasterContext';
import { useAuth } from './AuthContext';
import { ROLES } from '../config/roles';
import { 
  UPDATE_STATUS, 
  UPDATE_SEVERITY, 
  formatUpdateId, 
  isUpdateActive, 
  createSafetyUpdate,
  validateSafetyUpdateInput 
} from '../models/safetyUpdate';

const SafetyUpdateContext = createContext(null);

// Initial canonical seed updates for Assam Flood Response demo
const INITIAL_UPDATES = [
  {
    updateId: 'SU-0001',
    disasterId: 'DISASTER-001',
    title: 'Flood Safety Advisory: Low-Lying Sector 4',
    message: 'Residents in low-lying areas of Morigaon Sector 4 are advised to stay alert and prepare to move to elevated community relief centers if water levels continue rising.',
    severity: UPDATE_SEVERITY.CAUTION,
    status: UPDATE_STATUS.PUBLISHED,
    affectedArea: 'Morigaon Sector 4, Assam',
    createdBy: 'Command Center',
    createdAt: '2026-10-08T09:30:00.000Z',
    publishedAt: '2026-10-08T10:00:00.000Z',
    expiresAt: null,
    history: [
      {
        id: 'su-hist-1',
        action: 'Update created',
        actor: 'Command Center',
        timestamp: '2026-10-08T09:30:00.000Z',
        note: 'Draft safety update created by command operator.',
      },
      {
        id: 'su-hist-2',
        action: 'Review started',
        actor: 'Operational Commander',
        timestamp: '2026-10-08T09:45:00.000Z',
        note: 'Message verified for public dissemination.',
      },
      {
        id: 'su-hist-3',
        action: 'Safety update published',
        actor: 'Operational Commander',
        timestamp: '2026-10-08T10:00:00.000Z',
        note: 'Public safety advisory authorized and published.',
      },
    ],
  },
  {
    updateId: 'SU-0002',
    disasterId: 'DISASTER-001',
    title: 'Clean Drinking Water Distribution Points',
    message: 'Drinking water distribution points are operational at Morigaon Town Hall and Sector 2 High School. Citizens are advised to boil all tap or tube-well water before drinking.',
    severity: UPDATE_SEVERITY.INFO,
    status: UPDATE_STATUS.PUBLISHED,
    affectedArea: 'Morigaon Municipal Area',
    createdBy: 'Command Center',
    createdAt: '2026-10-08T11:00:00.000Z',
    publishedAt: '2026-10-08T11:15:00.000Z',
    expiresAt: null,
    history: [
      {
        id: 'su-hist-1',
        action: 'Update created',
        actor: 'Command Center',
        timestamp: '2026-10-08T11:00:00.000Z',
        note: 'Public distribution advisory drafted.',
      },
      {
        id: 'su-hist-2',
        action: 'Safety update published',
        actor: 'Command Center',
        timestamp: '2026-10-08T11:15:00.000Z',
        note: 'Published for citizen awareness.',
      },
    ],
  },
  {
    updateId: 'SU-0003',
    disasterId: 'DISASTER-001',
    title: 'Highway 12 Submerged Road Alert',
    message: 'State Highway 12 near Nagaon border is currently inundated by 1.2 meters of flood water. Avoid vehicular traffic on this route until clearance by emergency engineers.',
    severity: UPDATE_SEVERITY.URGENT,
    status: UPDATE_STATUS.UNDER_REVIEW,
    affectedArea: 'State Highway 12 (Sector 3 to Sector 4)',
    createdBy: 'Command Center',
    createdAt: '2026-10-08T13:00:00.000Z',
    publishedAt: null,
    expiresAt: null,
    history: [
      {
        id: 'su-hist-1',
        action: 'Update created',
        actor: 'Command Center',
        timestamp: '2026-10-08T13:00:00.000Z',
        note: 'Highway submerged advisory drafted.',
      },
      {
        id: 'su-hist-2',
        action: 'Review started',
        actor: 'Command Center',
        timestamp: '2026-10-08T13:10:00.000Z',
        note: 'Under final route verification before publishing.',
      },
    ],
  },
];

export function SafetyUpdateProvider({ children }) {
  const { currentDisaster } = useDisaster();
  const { role, currentUser } = useAuth();

  const activeDisasterId = currentDisaster?.id || 'DISASTER-001';

  const [updates, setUpdates] = useState(INITIAL_UPDATES);

  /**
   * Role Security Guard: Validates that current user is authorized to mutate safety updates.
   */
  const assertCommandCenterRole = useCallback(() => {
    if (role !== ROLES.COMMAND_CENTER) {
      throw new Error('Unauthorized: Only Command Center can create, modify, publish, or archive safety updates.');
    }
  }, [role]);

  /**
   * All updates filtered strictly by active disaster (Command Center view).
   */
  const disasterUpdates = useMemo(() => {
    return updates
      .filter(u => u.disasterId === activeDisasterId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [updates, activeDisasterId]);

  /**
   * Public safety updates visible to citizens and departments:
   * Rule: status === PUBLISHED AND not expired, sorted latest published first.
   */
  const publishedDisasterUpdates = useMemo(() => {
    const now = new Date();
    return updates
      .filter(u => u.disasterId === activeDisasterId && isUpdateActive(u, now))
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  }, [updates, activeDisasterId]);

  /**
   * Retrieves a specific safety update by ID.
   */
  const getUpdateById = useCallback((updateId) => {
    return updates.find(u => u.updateId === updateId) || null;
  }, [updates]);

  /**
   * Create a new draft safety update (Command Center only).
   */
  const createDraftUpdate = useCallback((inputData) => {
    assertCommandCenterRole();

    const sequence = updates.length + 1;
    const updateId = formatUpdateId(sequence);
    const actorName = currentUser?.name || 'Command Center Officer';

    const newRecord = createSafetyUpdate({
      ...inputData,
      disasterId: activeDisasterId,
    }, {
      updateId,
      createdBy: actorName,
    });

    setUpdates(prev => [newRecord, ...prev]);
    return newRecord;
  }, [assertCommandCenterRole, updates.length, currentUser?.name, activeDisasterId]);

  /**
   * Edit an existing draft safety update (Command Center only).
   */
  const editDraftUpdate = useCallback((updateId, updatedFields) => {
    assertCommandCenterRole();

    const validation = validateSafetyUpdateInput(updatedFields);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(`Validation Error: ${firstError}`);
    }

    setUpdates(prev => prev.map(u => {
      if (u.updateId !== updateId) return u;

      if (u.status !== UPDATE_STATUS.DRAFT && u.status !== UPDATE_STATUS.UNDER_REVIEW) {
        throw new Error('Only draft or under-review safety updates can be edited.');
      }

      const now = new Date().toISOString();
      const actorName = currentUser?.name || 'Command Center';

      return {
        ...u,
        title: updatedFields.title.trim(),
        message: updatedFields.message.trim(),
        affectedArea: updatedFields.affectedArea.trim(),
        severity: updatedFields.severity || u.severity,
        expiresAt: updatedFields.expiresAt !== undefined ? updatedFields.expiresAt : u.expiresAt,
        history: [
          ...u.history,
          {
            id: `su-hist-${u.history.length + 1}`,
            action: 'Update edited',
            actor: actorName,
            timestamp: now,
            note: 'Draft content updated.',
          },
        ],
      };
    }));
  }, [assertCommandCenterRole, currentUser?.name]);

  /**
   * Start review of a draft safety update (Command Center only).
   */
  const startReview = useCallback((updateId) => {
    assertCommandCenterRole();

    setUpdates(prev => prev.map(u => {
      if (u.updateId !== updateId) return u;

      if (u.status !== UPDATE_STATUS.DRAFT) {
        throw new Error('Only draft safety updates can enter review.');
      }

      const now = new Date().toISOString();
      const actorName = currentUser?.name || 'Command Center';

      return {
        ...u,
        status: UPDATE_STATUS.UNDER_REVIEW,
        history: [
          ...u.history,
          {
            id: `su-hist-${u.history.length + 1}`,
            action: 'Review started',
            actor: actorName,
            timestamp: now,
            note: 'Safety update moved to operational review prior to publishing.',
          },
        ],
      };
    }));
  }, [assertCommandCenterRole, currentUser?.name]);

  /**
   * Return an under-review update back to draft for editing (Command Center only).
   */
  const returnToDraft = useCallback((updateId) => {
    assertCommandCenterRole();

    setUpdates(prev => prev.map(u => {
      if (u.updateId !== updateId) return u;

      const now = new Date().toISOString();
      const actorName = currentUser?.name || 'Command Center';

      return {
        ...u,
        status: UPDATE_STATUS.DRAFT,
        history: [
          ...u.history,
          {
            id: `su-hist-${u.history.length + 1}`,
            action: 'Returned to draft',
            actor: actorName,
            timestamp: now,
            note: 'Safety update returned to draft for revisions.',
          },
        ],
      };
    }));
  }, [assertCommandCenterRole, currentUser?.name]);

  /**
   * Publish a safety update to the public citizen domain (Command Center only).
   */
  const publishUpdate = useCallback((updateId) => {
    assertCommandCenterRole();

    setUpdates(prev => prev.map(u => {
      if (u.updateId !== updateId) return u;

      if (u.status !== UPDATE_STATUS.UNDER_REVIEW && u.status !== UPDATE_STATUS.DRAFT) {
        throw new Error('Only draft or under-review safety updates can be published.');
      }

      const now = new Date().toISOString();
      const actorName = currentUser?.name || 'Command Center';

      return {
        ...u,
        status: UPDATE_STATUS.PUBLISHED,
        publishedAt: now,
        history: [
          ...u.history,
          {
            id: `su-hist-${u.history.length + 1}`,
            action: 'Safety update published',
            actor: actorName,
            timestamp: now,
            note: 'Public safety notice authorized and published to citizens.',
          },
        ],
      };
    }));
  }, [assertCommandCenterRole, currentUser?.name]);

  /**
   * Archive a published safety update (Command Center only).
   * Note: Does NOT delete the record; keeps it in Command Center history.
   */
  const archiveUpdate = useCallback((updateId) => {
    assertCommandCenterRole();

    setUpdates(prev => prev.map(u => {
      if (u.updateId !== updateId) return u;

      const now = new Date().toISOString();
      const actorName = currentUser?.name || 'Command Center';

      return {
        ...u,
        status: UPDATE_STATUS.ARCHIVED,
        history: [
          ...u.history,
          {
            id: `su-hist-${u.history.length + 1}`,
            action: 'Safety update archived',
            actor: actorName,
            timestamp: now,
            note: 'Update retired from public citizen visibility.',
          },
        ],
      };
    }));
  }, [assertCommandCenterRole, currentUser?.name]);

  return (
    <SafetyUpdateContext.Provider
      value={{
        updates,
        disasterUpdates,
        publishedDisasterUpdates,
        getUpdateById,
        createDraftUpdate,
        editDraftUpdate,
        startReview,
        returnToDraft,
        publishUpdate,
        archiveUpdate,
        isUpdateActive,
      }}
    >
      {children}
    </SafetyUpdateContext.Provider>
  );
}

export function useSafetyUpdate() {
  const context = useContext(SafetyUpdateContext);
  if (!context) {
    throw new Error('useSafetyUpdate must be used within a SafetyUpdateProvider');
  }
  return context;
}

export default SafetyUpdateContext;
