/**
 * User Roles and Department Definitions for RELIEF-OS
 */

export const ROLES = {
  CITIZEN: 'CITIZEN',
  COMMAND_CENTER: 'COMMAND_CENTER',
  DEPARTMENT: 'DEPARTMENT',
};

export const DEPARTMENTS = {
  HEALTH: 'HEALTH',
  FOOD_SUPPLY: 'FOOD_SUPPLY',
  RESCUE: 'RESCUE',
};

export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  COMMAND_CENTER: 'Command Center Operator',
  DEPARTMENT: 'Department User',
};

export const DEPARTMENT_LABELS = {
  HEALTH: 'Health Department',
  FOOD_SUPPLY: 'Food & Supply',
  RESCUE: 'Rescue Department',
};

export const ROLE_DEFAULT_ROUTES = {
  CITIZEN: '/citizen/dashboard',
  COMMAND_CENTER: '/command/dashboard',
  DEPARTMENT: '/department/dashboard',
};

export const DEMO_USERS = [
  {
    id: 'user-citizen',
    email: 'citizen@relief.local',
    name: 'Ramesh Borah',
    role: ROLES.CITIZEN,
    department: null,
    title: 'Citizen / Resident',
    avatar: 'RB',
    badge: 'Resident'
  },
  {
    id: 'user-command',
    email: 'command@relief.local',
    name: 'Commander R. Sharma',
    role: ROLES.COMMAND_CENTER,
    department: null,
    title: 'Duty Commander',
    avatar: 'RS',
    badge: 'DUTY-OPS-01'
  },
  {
    id: 'user-health',
    email: 'health@relief.local',
    name: 'Dr. Ananya Roy',
    role: ROLES.DEPARTMENT,
    department: DEPARTMENTS.HEALTH,
    title: 'Chief Medical Officer',
    avatar: 'AR',
    badge: 'HEALTH-MED-1'
  },
  {
    id: 'user-supply',
    email: 'supply@relief.local',
    name: 'Pradip Das',
    role: ROLES.DEPARTMENT,
    department: DEPARTMENTS.FOOD_SUPPLY,
    title: 'Logistics & Supply Director',
    avatar: 'PD',
    badge: 'LOGISTICS-SUP-2'
  },
  {
    id: 'user-rescue',
    email: 'rescue@relief.local',
    name: 'Insp. Vikram Gogoi',
    role: ROLES.DEPARTMENT,
    department: DEPARTMENTS.RESCUE,
    title: 'NDRF Rescue Unit Head',
    avatar: 'VG',
    badge: 'NDRF-SAR-4'
  }
];

export const DEMO_PASSWORD = 'demo';
