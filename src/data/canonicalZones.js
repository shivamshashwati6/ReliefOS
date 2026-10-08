/**
 * RELIEF-OS Canonical Affected Zone Data
 * PRD canonical demographic and geographic definitions for Assam Flood scenario.
 */

export const INITIAL_ZONES_DATA = [
  {
    id: "zone-a",
    disasterId: "DISASTER-001",
    name: "Zone A",
    fullName: "Zone A — Morigaon Sector 4",
    location: { lat: 26.25, lng: 92.34 },
    affectedPopulation: 3842,
    baselineSeverity: 1.00,
    baselineMedicalRisk: 1.00,
    baselineShortage: 0.80,
    accessibilityDifficulty: 0.95,
    vulnerability: 1.00,
    waterLevel: "3.4m (+0.6m/h)",
    foodShortage: "72%",
    waterShortage: "61%",
    nearestShelter: "5.4 km",
    keyIssue: "Embankment breach at Sector 4",
    accessStatus: "Cut Off by Road",
    keywords: ["morigaon", "sector 4", "primary school", "breach", "embankment", "roof"]
  },
  {
    id: "zone-b",
    disasterId: "DISASTER-001",
    name: "Zone B",
    fullName: "Zone B — Nagaon Lowland Reach",
    location: { lat: 26.35, lng: 92.68 },
    affectedPopulation: 5610,
    baselineSeverity: 0.75,
    baselineMedicalRisk: 0.70,
    baselineShortage: 0.60,
    accessibilityDifficulty: 0.80,
    vulnerability: 1.00,
    waterLevel: "2.8m (+0.3m/h)",
    foodShortage: "45%",
    waterShortage: "52%",
    nearestShelter: "8.2 km",
    keyIssue: "Access roads submerged",
    accessStatus: "Route A Flooded / Route C Open",
    keywords: ["nagaon", "km 42", "culvert", "route a", "lowland", "shelter b"]
  },
  {
    id: "zone-c",
    disasterId: "DISASTER-001",
    name: "Zone C",
    fullName: "Zone C — Kaliabor Highlands Edge",
    location: { lat: 26.51, lng: 92.97 },
    affectedPopulation: 4920,
    baselineSeverity: 0.50,
    baselineMedicalRisk: 0.35,
    baselineShortage: 0.53,
    accessibilityDifficulty: 0.60,
    vulnerability: 1.00,
    waterLevel: "1.9m (Stable)",
    foodShortage: "30%",
    waterShortage: "35%",
    nearestShelter: "12.0 km",
    keyIssue: "Power grid disconnected",
    accessStatus: "Restricted Heavy Vehicles",
    keywords: ["kaliabor", "highlands", "power grid", "transformer"]
  },
  {
    id: "zone-d",
    disasterId: "DISASTER-001",
    name: "Zone D",
    fullName: "Zone D — Dhing Rural Ward",
    location: { lat: 26.47, lng: 92.48 },
    affectedPopulation: 4048,
    baselineSeverity: 0.25,
    baselineMedicalRisk: 0.05,
    baselineShortage: 0.20,
    accessibilityDifficulty: 0.20,
    vulnerability: 0.20,
    waterLevel: "0.8m (Receding)",
    foodShortage: "15%",
    waterShortage: "20%",
    nearestShelter: "3.1 km",
    keyIssue: "Relief cache deployed",
    accessStatus: "Open Secondary Roads",
    keywords: ["dhing", "rural", "ward", "village", "secondary"]
  }
];

/**
 * Deterministically maps a report to a zone using reported location/landmarks or coordinates.
 * MVP demo implementation designed to be replaced by polygon administrative boundaries or GIS.
 */
export function matchReportToZone(report, availableZones = INITIAL_ZONES_DATA) {
  if (!report) return availableZones[0]?.id || 'zone-a';

  const loc = (report.location || '').toLowerCase();
  const desc = (report.description || '').toLowerCase();
  const text = `${loc} ${desc}`;

  for (const zone of availableZones) {
    if (zone.keywords) {
      for (const kw of zone.keywords) {
        if (text.includes(kw)) {
          return zone.id;
        }
      }
    }
  }

  // Fallback to zone A
  return availableZones[0]?.id || 'zone-a';
}
