/**
 * RELIEF-OS Command Center Demo Data
 * All metrics and states in this file are simulated representations
 * for UI presentation and tactical visualization.
 */

export const DISASTER_EVENT = {
  id: "DIS-2026-ASM-04",
  name: "Assam Flood Response",
  code: "SIM-OPS-088",
  type: "Flood",
  basin: "Brahmaputra Valley Basin",
  sector: "Morigaon, Assam",
  status: "Active",
  isSimulated: true,
  commencedAt: "2026-10-06T04:30:00Z",
  leadAgency: "Operations Response Team",
  commander: {
    name: "Commander R. Sharma",
    callsign: "DUTY-OPS-01",
    role: "Duty Commander",
    agency: "Emergency Response Ops",
    avatar: "RS"
  }
};

export const KPI_DATA = [
  {
    id: "active_disaster",
    label: "Active Disaster",
    value: "Assam Flood",
    subtext: "Cat IV Basin Inundation",
    category: "incident",
    status: "critical",
    iconName: "FlameAlert",
    change: "+2 Sub-districts"
  },
  {
    id: "affected_people",
    label: "Affected People",
    value: "18,420",
    subtext: "Across 4 priority sectors",
    category: "population",
    status: "high",
    iconName: "Users",
    change: "+1,240 past 6h"
  },
  {
    id: "critical_zones",
    label: "Critical Zones",
    value: "07",
    subtext: "Requires immediate airlift/boat",
    category: "zones",
    status: "critical",
    iconName: "ShieldAlert",
    change: "3 breach points"
  },
  {
    id: "resource_shortages",
    label: "Resource Shortages",
    value: "04",
    subtext: "Potable water & NDRF boats",
    category: "logistics",
    status: "high",
    iconName: "AlertTriangle",
    change: "Supply transit ETA 45m"
  },
  {
    id: "active_teams",
    label: "Active Teams",
    value: "23",
    subtext: "NDRF, SDRF & Armed Forces",
    category: "personnel",
    status: "normal",
    iconName: "Radio",
    change: "4 air units deployed"
  },
  {
    id: "shelter_occupancy",
    label: "Shelter Occupancy",
    value: "71%",
    subtext: "12 of 17 centers active",
    category: "shelter",
    status: "medium",
    iconName: "Home",
    change: "Capacity strain: Sector B"
  }
];

export const PRIORITY_ZONES = [
  {
    id: "zone-a",
    name: "Zone A",
    fullName: "Zone A — Morigaon Sector 4",
    priorityScore: 94,
    priorityBand: "Critical",
    affectedPopulation: "3,842",
    waterLevel: "3.4m (+0.6m/h)",
    medicalRisk: "High",
    status: "Immediate Intervention Required",
    accessStatus: "Cut Off by Road",
    keyIssue: "Embankment breach at Sector 4",
    coords: { lat: 26.25, lng: 92.34 },
    lastUpdated: "4 mins ago"
  },
  {
    id: "zone-b",
    name: "Zone B",
    fullName: "Zone B — Nagaon Lowland Reach",
    priorityScore: 81,
    priorityBand: "High",
    affectedPopulation: "5,610",
    waterLevel: "2.8m (+0.3m/h)",
    medicalRisk: "Moderate",
    status: "Evacuation In Progress",
    accessStatus: "Route A Flooded / Route C Open",
    keyIssue: "Access roads submerged",
    coords: { lat: 26.35, lng: 92.68 },
    lastUpdated: "12 mins ago"
  },
  {
    id: "zone-c",
    name: "Zone C",
    fullName: "Zone C — Kaliabor Highlands Edge",
    priorityScore: 63,
    priorityBand: "Medium",
    affectedPopulation: "4,920",
    waterLevel: "1.9m (Stable)",
    medicalRisk: "Low",
    status: "Under Continuous Monitoring",
    accessStatus: "Restricted Heavy Vehicles",
    keyIssue: "Power grid disconnected",
    coords: { lat: 26.51, lng: 92.97 },
    lastUpdated: "22 mins ago"
  },
  {
    id: "zone-d",
    name: "Zone D",
    fullName: "Zone D — Dhing Rural Ward",
    priorityScore: 31,
    priorityBand: "Low",
    affectedPopulation: "4,048",
    waterLevel: "0.8m (Receding)",
    medicalRisk: "Low",
    status: "Stable / Sheltered",
    accessStatus: "Open Secondary Roads",
    keyIssue: "Relief cache deployed",
    coords: { lat: 26.47, lng: 92.48 },
    lastUpdated: "35 mins ago"
  }
];

export const RESOURCE_STATUS = [
  {
    id: "food",
    name: "Food Supplies",
    value: 72,
    unit: "%",
    type: "percentage",
    stockText: "14,200 / 19,800 MRE Rations",
    status: "normal",
    burnRate: "420 packs/hour",
    icon: "UtensilsCrossed"
  },
  {
    id: "water",
    name: "Potable Water",
    value: 48,
    unit: "%",
    type: "percentage",
    stockText: "24,000 / 50,000 Liters",
    status: "warning",
    burnRate: "850 L/hour (Deficit Warning)",
    icon: "Droplets"
  },
  {
    id: "medical",
    name: "Medical Teams",
    value: 12,
    unit: "Teams",
    type: "count",
    stockText: "12 Active / 4 In Reserve",
    status: "normal",
    burnRate: "8 Field triage units deployed",
    icon: "Stethoscope"
  },
  {
    id: "boats",
    name: "Rescue Boats",
    value: 18,
    unit: "Boats",
    type: "count",
    stockText: "18 Deployed / 2 Maintenance",
    status: "normal",
    burnRate: "Operating at 90% duty cycle",
    icon: "LifeBuoy"
  },
  {
    id: "vehicles",
    name: "Heavy Vehicles",
    value: 21,
    unit: "Units",
    type: "count",
    stockText: "21 Amphibious / 4x4 Operational",
    status: "normal",
    burnRate: "Route C logistics convoy",
    icon: "Truck"
  },
  {
    id: "shelters",
    name: "Shelter Capacity",
    value: 71,
    unit: "%",
    type: "percentage",
    stockText: "8,520 / 12,000 Occupants",
    status: "warning",
    burnRate: "Approaching threshold in Sector B",
    icon: "Building"
  }
];

export const AI_RECOMMENDATION = {
  alertLevel: "CRITICAL",
  title: "AI PRIORITY ALERT",
  headline: "Zone A requires immediate response.",
  zone: "Zone A",
  confidence: "98.4%",
  engine: "Disaster Response Decision Engine v2.4 (Simulated)",
  generatedAt: "2 mins ago",
  metrics: {
    priority: "94/100",
    affectedPopulation: "3,842",
    medicalRisk: "High",
    foodShortage: "72%",
    waterShortage: "61%"
  },
  recommendedActions: [
    { id: 1, text: "Deploy 4 rescue boats", priority: "Immediate", unit: "NDRF Unit 7" },
    { id: 2, text: "Send 1,200 food kits", priority: "High", unit: "Central Depot" },
    { id: 3, text: "Send 800 water units", priority: "High", unit: "Purification Unit 2" },
    { id: 4, text: "Deploy 1 medical team", priority: "Critical", unit: "Army Field Med 3" }
  ],
  routeIntelligence: {
    blockedRoute: "Route A is flooded.",
    selectedRoute: "Route C is currently selected.",
    detourTime: "+22 mins",
    clearanceStatus: "All-terrain vehicles / Amphibious certified"
  }
};

export const CRITICAL_ALERTS = [
  {
    id: "alt-01",
    title: "Route A flooded",
    severity: "critical",
    category: "Access / Route",
    zone: "Zone B — Nagaon Corridor",
    timestamp: "10m ago",
    detail: "Brahmaputra tributary overflow at KM 42. Traffic diverted to Route C."
  },
  {
    id: "alt-02",
    title: "Zone A medical emergency",
    severity: "critical",
    category: "Medical / Triage",
    zone: "Zone A — Sector 4",
    timestamp: "18m ago",
    detail: "Infant dehydration cluster reported at Community Hall shelter point."
  },
  {
    id: "alt-03",
    title: "Food shortage detected",
    severity: "high",
    category: "Supply Deficit",
    zone: "Zone A & C Border",
    timestamp: "32m ago",
    detail: "MRE stocks below 18 hours operational threshold. Re-supply en route."
  },
  {
    id: "alt-04",
    title: "Shelter B approaching capacity",
    severity: "medium",
    category: "Infrastructure",
    zone: "Sector B Central High School",
    timestamp: "45m ago",
    detail: "Current occupancy 92%. Secondary shelter site C-1 being prepped."
  }
];

export const MAP_LEGEND_ITEMS = [
  { label: "Critical Zone (Score > 90)", color: "#ef4444", type: "zone" },
  { label: "High Zone (Score 75-89)", color: "#f97316", type: "zone" },
  { label: "Medium Zone (Score 50-74)", color: "#eab308", type: "zone" },
  { label: "Low Zone (Score < 50)", color: "#10b981", type: "zone" },
  { label: "Shelters (12 Active)", color: "#38bdf8", type: "facility" },
  { label: "Resource Centers", color: "#a855f7", type: "facility" },
  { label: "Medical Facilities", color: "#ec4899", type: "facility" },
  { label: "Blocked Roads (Route A)", color: "#dc2626", dashed: true, type: "route" },
  { label: "Active Relief Route (Route C)", color: "#22c55e", type: "route" }
];

export const NAV_LINKS = [
  { id: "command-center", label: "Dashboard", icon: "LayoutDashboard", path: "/" },
  { id: "reports", label: "Reports", icon: "FileText", path: "/reports" },
  { id: "zones", label: "Zones", icon: "MapPin", path: "/zones" },
  { id: "resources", label: "Resources", icon: "Boxes" },
  { id: "response-plans", label: "Response Plans", icon: "ClipboardList" },
  { id: "simulation-lab", label: "Simulation", icon: "Sliders" },
  { id: "emergency-report", label: "Report Emergency", icon: "AlertOctagon", path: "/report-emergency" },
  { id: "create-disaster", label: "Create Disaster", icon: "PlusCircle", path: "/create-disaster" },
  { id: "settings", label: "Settings", icon: "Settings" }
];
