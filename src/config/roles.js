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
  FOOD_SUPPLY: 'Food & Supply Department',
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
    name: 'Shashwati',
    role: ROLES.CITIZEN,
    department: null,
    title: 'Citizen',
    avatar: 'SH',
    badge: 'Citizen'
  },
  {
    id: 'user-command',
    email: 'command@relief.local',
    name: 'Command Operator',
    role: ROLES.COMMAND_CENTER,
    department: null,
    title: 'Command Center',
    avatar: 'CO',
    badge: 'Command Center'
  },
  {
    id: 'user-health',
    email: 'health@relief.local',
    name: 'Health Team',
    role: ROLES.DEPARTMENT,
    department: DEPARTMENTS.HEALTH,
    title: 'Health Department Lead',
    avatar: 'HT',
    badge: 'Health Department'
  },
  {
    id: 'user-supply',
    email: 'supply@relief.local',
    name: 'Food & Supply Team',
    role: ROLES.DEPARTMENT,
    department: DEPARTMENTS.FOOD_SUPPLY,
    title: 'Food & Supply Coordinator',
    avatar: 'FS',
    badge: 'Food & Supply Department'
  },
  {
    id: 'user-rescue',
    email: 'rescue@relief.local',
    name: 'Rescue Team',
    role: ROLES.DEPARTMENT,
    department: DEPARTMENTS.RESCUE,
    title: 'Rescue Operations',
    avatar: 'RT',
    badge: 'Rescue Department'
  }
];

export const DEMO_PASSWORD = 'demo';
