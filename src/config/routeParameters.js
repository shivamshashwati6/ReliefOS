/**
 * RELIEF-OS Route Engine Configuration & Parameters
 * 
 * Defines road segment statuses, graph node definitions, connectivity edges,
 * canonical demo routes, and traversal cost parameters.
 * 
 * STRICT PROTOTYPE INTEGRITY:
 * All routes and road segments are clearly identified as SIMULATED.
 * Never claim simulated paths represent live GPS navigation or real-world transit guarantees.
 */

export const ROAD_SEGMENT_STATUS = {
  OPEN: 'OPEN',
  PARTIAL: 'PARTIAL',
  BLOCKED: 'BLOCKED',
};

export const ROUTE_STATUS = {
  OPTIMAL: 'OPTIMAL',
  ALTERNATIVE: 'ALTERNATIVE',
  NO_ROUTE: 'NO_ROUTE',
  INVALID_INPUT: 'INVALID_INPUT',
};

export const ROUTE_PARAMETERS = {
  // Penalty multiplier applied to baseDistance for PARTIAL status segments (e.g. water on shoulder)
  DEFAULT_PARTIAL_COST_MULTIPLIER: 1.8,
  
  // Baseline average transit speeds for simulated travel time approximations
  AVERAGE_SPEED_OPEN_KMH: 45,
  AVERAGE_SPEED_PARTIAL_KMH: 20,

  // Demo heroic endpoints
  DEFAULT_ORIGIN_NODE: 'node-central-depot',
  DEFAULT_HERO_DESTINATION_NODE: 'node-zone-a',
};

export const SIMULATED_ROAD_SAFETY_DISCLAIMER = 
  'SIMULATED RELIEF ROUTE: Generated for hackathon decision-support drill. ' +
  'Not an active transit guarantee or verified live navigation corridor. ' +
  'Road clearance requires ground verification prior to any vehicle deployment.';

/**
 * Canonical Graph Nodes for Disaster Response Basin (Assam Flood DISASTER-001)
 * Schematic coordinates align with MapPanel.jsx SVG canvas (1000 x 650)
 */
export const CANONICAL_ROUTE_NODES = {
  'node-central-depot': {
    id: 'node-central-depot',
    name: 'Central Relief Depot',
    description: 'Central regional supply depot and staging hub at Morigaon Base',
    type: 'RESOURCE_CENTER',
    coordinates: { x: 520, y: 490 },
    latLng: { lat: 26.20, lng: 92.40 },
  },
  'node-junc-culvert-km42': {
    id: 'node-junc-culvert-km42',
    name: 'KM 42 Lowland Culvert Junction',
    description: 'Lowland highway intersection near Brahmaputra drainage basin',
    type: 'INTERSECTION',
    coordinates: { x: 440, y: 380 },
    latLng: { lat: 26.22, lng: 92.36 },
  },
  'node-zone-a': {
    id: 'node-zone-a',
    name: 'Zone A — Morigaon Sector 4',
    description: 'Hero disaster impact sector; breached embankment and cut-off road access',
    type: 'ZONE',
    zoneId: 'zone-a',
    coordinates: { x: 340, y: 270 },
    latLng: { lat: 26.25, lng: 92.34 },
  },
  'node-junc-nagaon-high': {
    id: 'node-junc-nagaon-high',
    name: 'Nagaon High Bypass Junction',
    description: 'Elevated bypass spur connecting to high ridge corridor',
    type: 'INTERSECTION',
    coordinates: { x: 620, y: 440 },
    latLng: { lat: 26.28, lng: 92.55 },
  },
  'node-junc-north-bridge': {
    id: 'node-junc-north-bridge',
    name: 'North Embankment Bridge Junction',
    description: 'Reinforced elevated bridge spanning northern flood plain',
    type: 'INTERSECTION',
    coordinates: { x: 470, y: 220 },
    latLng: { lat: 26.38, lng: 92.42 },
  },
  'node-zone-b': {
    id: 'node-zone-b',
    name: 'Zone B — Nagaon Lowland Reach',
    description: 'Submerged access routes; secondary distribution point',
    type: 'ZONE',
    zoneId: 'zone-b',
    coordinates: { x: 620, y: 470 },
    latLng: { lat: 26.35, lng: 92.68 },
  },
  'node-zone-c': {
    id: 'node-zone-c',
    name: 'Zone C — Kaliabor Highlands Edge',
    description: 'Highland staging area; disconnected power grid',
    type: 'ZONE',
    zoneId: 'zone-c',
    coordinates: { x: 820, y: 350 },
    latLng: { lat: 26.51, lng: 92.97 },
  },
  'node-zone-d': {
    id: 'node-zone-d',
    name: 'Zone D — Dhing Rural Ward',
    description: 'Receding flood sector with secondary road access',
    type: 'ZONE',
    zoneId: 'zone-d',
    coordinates: { x: 470, y: 220 },
    latLng: { lat: 26.47, lng: 92.48 },
  },
};

/**
 * Canonical Road Segments for DISASTER-001.
 * Matches PRD scenario: Route A (lowland culvert, flooded) vs Route C (elevated bypass, open).
 */
export const CANONICAL_ROAD_SEGMENTS = [
  // --- ROUTE A CORRIDOR (Lowland Direct Route: 18.5 km) ---
  {
    id: 'seg-route-a-1',
    routeCode: 'ROUTE_A',
    name: 'Route A — Sector 1 (Depot to KM 42 Culvert)',
    from: 'node-central-depot',
    to: 'node-junc-culvert-km42',
    distanceKm: 9.2,
    baseCost: 9.2,
    status: ROAD_SEGMENT_STATUS.BLOCKED, // Canonical demo state: blocked by flood
    condition: 'Flooded culvert at KM 42; water depth 1.4m',
    surface: 'Submerged Lowland Highway',
    bidirectional: true,
    svgPath: 'M 520,490 L 460,400 L 440,380',
  },
  {
    id: 'seg-route-a-2',
    routeCode: 'ROUTE_A',
    name: 'Route A — Sector 2 (KM 42 Culvert to Zone A)',
    from: 'node-junc-culvert-km42',
    to: 'node-zone-a',
    distanceKm: 9.3,
    baseCost: 9.3,
    status: ROAD_SEGMENT_STATUS.BLOCKED, // Canonical demo state: blocked by flood
    condition: 'Inundated road approach near Sector 4 primary school',
    surface: 'Submerged Lowland Highway',
    bidirectional: true,
    svgPath: 'M 440,380 L 410,340 L 340,270',
  },

  // --- ROUTE C CORRIDOR (Elevated High Bypass: 29.2 km) ---
  {
    id: 'seg-route-c-1',
    routeCode: 'ROUTE_C',
    name: 'Route C — Sector 1 (Depot to Nagaon High Bypass)',
    from: 'node-central-depot',
    to: 'node-junc-nagaon-high',
    distanceKm: 11.4,
    baseCost: 11.4,
    status: ROAD_SEGMENT_STATUS.OPEN,
    condition: 'Dry elevated concrete bypass; clear for all transport craft',
    surface: 'Elevated High Bypass',
    bidirectional: true,
    svgPath: 'M 520,490 L 620,470 L 620,440',
  },
  {
    id: 'seg-route-c-2',
    routeCode: 'ROUTE_C',
    name: 'Route C — Sector 2 (High Bypass to North Embankment Bridge)',
    from: 'node-junc-nagaon-high',
    to: 'node-junc-north-bridge',
    distanceKm: 10.8,
    baseCost: 10.8,
    status: ROAD_SEGMENT_STATUS.OPEN,
    condition: 'Reinforced elevated highway ridge; open with caution',
    surface: 'Reinforced State Highway',
    bidirectional: true,
    svgPath: 'M 620,440 L 590,360 L 470,220',
  },
  {
    id: 'seg-route-c-3',
    routeCode: 'ROUTE_C',
    name: 'Route C — Sector 3 (North Embankment to Zone A)',
    from: 'node-junc-north-bridge',
    to: 'node-zone-a',
    distanceKm: 7.0,
    baseCost: 7.0,
    status: ROAD_SEGMENT_STATUS.OPEN,
    condition: 'Graded northern access route; all relief trucks passable',
    surface: 'Reinforced Northern Access Road',
    bidirectional: true,
    svgPath: 'M 470,220 L 370,240 L 340,270',
  },

  // --- ANCILLARY REGIONAL CONNECTORS ---
  {
    id: 'seg-nagaon-to-zone-b',
    routeCode: 'ROUTE_B',
    name: 'Bypass Spur to Zone B',
    from: 'node-junc-nagaon-high',
    to: 'node-zone-b',
    distanceKm: 4.5,
    baseCost: 4.5,
    status: ROAD_SEGMENT_STATUS.PARTIAL,
    condition: 'Water on shoulders; restricted to high-clearance 4x4 vehicles',
    surface: 'Secondary Paved Road',
    bidirectional: true,
    svgPath: 'M 620,440 L 620,470',
  },
  {
    id: 'seg-north-to-zone-d',
    routeCode: 'ROUTE_D',
    name: 'Northern Connector to Zone D',
    from: 'node-junc-north-bridge',
    to: 'node-zone-d',
    distanceKm: 5.2,
    baseCost: 5.2,
    status: ROAD_SEGMENT_STATUS.OPEN,
    condition: 'Receding water; secondary rural road open',
    surface: 'Rural Paved Road',
    bidirectional: true,
    svgPath: 'M 470,220 L 470,220',
  },
  {
    id: 'seg-nagaon-to-zone-c',
    routeCode: 'ROUTE_HIGHLAND',
    name: 'Eastern Highway to Zone C',
    from: 'node-junc-nagaon-high',
    to: 'node-zone-c',
    distanceKm: 16.5,
    baseCost: 16.5,
    status: ROAD_SEGMENT_STATUS.OPEN,
    condition: 'Highland road clear; power lines down on shoulder',
    surface: 'National Highway Spur',
    bidirectional: true,
    svgPath: 'M 620,440 L 740,400 L 820,350',
  },
];
