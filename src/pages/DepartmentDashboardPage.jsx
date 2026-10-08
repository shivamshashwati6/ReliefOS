import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HeartPulse, 
  Package, 
  LifeBuoy, 
  AlertTriangle, 
  Users, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Droplet, 
  Ship, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDisaster } from '../context/DisasterContext';
import { useReports } from '../context/ReportContext';
import { PRIORITY_ZONES, CRITICAL_ALERTS, KPI_DATA } from '../data/demoData';
import { DEPARTMENTS } from '../config/roles';

export function DepartmentDashboardPage() {
  const { currentUser } = useAuth();
  const { currentDisaster } = useDisaster();
  const { reports } = useReports();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active department: from route subpath (/department/health etc.) or user's department, fallback to HEALTH
  const getInitialDept = () => {
    if (location.pathname.includes('/health')) return DEPARTMENTS.HEALTH;
    if (location.pathname.includes('/supply')) return DEPARTMENTS.FOOD_SUPPLY;
    if (location.pathname.includes('/rescue')) return DEPARTMENTS.RESCUE;
    return currentUser?.department || DEPARTMENTS.HEALTH;
  };

  const [activeDept, setActiveDept] = useState(getInitialDept);

  // Sync if location changes
  React.useEffect(() => {
    if (location.pathname.includes('/health')) setActiveDept(DEPARTMENTS.HEALTH);
    else if (location.pathname.includes('/supply')) setActiveDept(DEPARTMENTS.FOOD_SUPPLY);
    else if (location.pathname.includes('/rescue')) setActiveDept(DEPARTMENTS.RESCUE);
    else if (currentUser?.department) setActiveDept(currentUser.department);
  }, [location.pathname, currentUser?.department]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Department Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Department Operations Desk
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentDisaster.name || 'Assam Flood Response'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeDept === DEPARTMENTS.HEALTH && 'Health Response'}
              {activeDept === DEPARTMENTS.FOOD_SUPPLY && 'Food & Supply Response'}
              {activeDept === DEPARTMENTS.RESCUE && 'Rescue Response'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeDept === DEPARTMENTS.HEALTH && 'Clinical triage, field ambulance coordination, and emergency pharmaceutical requisitions.'}
              {activeDept === DEPARTMENTS.FOOD_SUPPLY && 'Ration kit allocation, potable water logistics, and relief shelter provisioning.'}
              {activeDept === DEPARTMENTS.RESCUE && 'Flood evacuation logistics, NDRF vessel deployment, and search-and-rescue assets.'}
            </p>
          </div>

          {/* Department Quick Switcher Tabs (For demo ease) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveDept(DEPARTMENTS.HEALTH)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDept === DEPARTMENTS.HEALTH
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Health</span>
            </button>
            <button
              onClick={() => setActiveDept(DEPARTMENTS.FOOD_SUPPLY)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDept === DEPARTMENTS.FOOD_SUPPLY
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Food & Supply</span>
            </button>
            <button
              onClick={() => setActiveDept(DEPARTMENTS.RESCUE)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDept === DEPARTMENTS.RESCUE
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Rescue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Content based on Department */}
      {activeDept === DEPARTMENTS.HEALTH && (
        <HealthDepartmentView reports={reports} />
      )}

      {activeDept === DEPARTMENTS.FOOD_SUPPLY && (
        <FoodSupplyDepartmentView reports={reports} />
      )}

      {activeDept === DEPARTMENTS.RESCUE && (
        <RescueDepartmentView reports={reports} />
      )}
    </div>
  );
}

/**
 * HEALTH DEPARTMENT VIEW
 * Show:
 * - Medical emergencies
 * - Medical teams needed
 * - Medicine needs
 * - Critical zones
 */
function HealthDepartmentView({ reports }) {
  const criticalMedicalZones = PRIORITY_ZONES.filter(
    (z) => z.medicalRisk === 'High' || z.priorityScore > 80
  );

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Medical Emergencies</span>
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">14 Active</div>
          <div className="text-xs text-rose-700 font-medium">3 Critical triage cases</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Medical Teams Needed</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">5 Teams</div>
          <div className="text-xs text-blue-700 font-medium">Army Field Med 3 deployed</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Medicine Needs</span>
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">6,520 Units</div>
          <div className="text-xs text-emerald-700 font-medium">ORS & Water Purification</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Zones</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{criticalMedicalZones.length} Sectors</div>
          <div className="text-xs text-amber-700 font-medium">Zone A & Zone C High Risk</div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Medical Emergencies & Reports */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>Active Medical Incidents</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Immediate Attention
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">Zone A: Infant Dehydration Cluster</span>
                <span className="text-[11px] font-semibold text-rose-700">18m ago</span>
              </div>
              <p className="text-xs text-slate-600">
                Infant dehydration cases reported at Morigaon Community Hall shelter point. Pediatric ORS and IV fluids needed urgently.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Elderly Mobility & Chronic Care</span>
                <span className="text-[11px] font-semibold text-slate-500">25m ago</span>
              </div>
              <p className="text-xs text-slate-600">
                Three elderly residents near Primary School Sector 4 require stretcher assistance and insulin re-supply.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Waterborne Illness Precaution</span>
                <span className="text-[11px] font-semibold text-slate-500">45m ago</span>
              </div>
              <p className="text-xs text-slate-600">
                Borehole contamination in Shelter B necessitates prophylactic medicine distribution to 40 families.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Critical Zones & Medicine Needs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Critical Zones */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Critical Health Zones</span>
            </h2>
            <div className="space-y-2.5">
              {criticalMedicalZones.map((z) => (
                <div key={z.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{z.name} — {z.fullName}</div>
                    <div className="text-[11px] text-slate-500">Affected Pop: {z.affectedPopulation} • Water: {z.waterLevel}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 shrink-0">
                    High Risk
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Medicine Needs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Pharmaceutical Requisitions</span>
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">ORS Rehydration Sachets</span>
                <span className="font-bold text-slate-900">1,500 units</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">Water Purification Tablets</span>
                <span className="font-bold text-slate-900">5,000 units</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">Trauma & First Aid Kits</span>
                <span className="font-bold text-slate-900">120 kits</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">Polyvalent Antivenom Vials</span>
                <span className="font-bold text-slate-900">25 vials</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FOOD & SUPPLY DEPARTMENT VIEW
 * Show:
 * - Food needed
 * - Water needed
 * - Supply shortages
 * - Affected zones
 */
function FoodSupplyDepartmentView({ reports }) {
  const affectedSupplyZones = PRIORITY_ZONES;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Food Needed</span>
            <Package className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">4,200 Kits</div>
          <div className="text-xs text-amber-700 font-medium">Dry Rations & MRE packs</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Water Needed</span>
            <Droplet className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">12,000 L</div>
          <div className="text-xs text-blue-700 font-medium">800 Water units pending</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supply Shortages</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">4 Critical</div>
          <div className="text-xs text-rose-700 font-medium">Supply transit ETA 45m</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Affected Zones</span>
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">4 Zones</div>
          <div className="text-xs text-emerald-700 font-medium">18,420 affected persons</div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Supply Shortages */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Supply Shortages & Distribution</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Logistics Pipeline
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Food Shortage Alert: Zone A & C Border</span>
                <span className="text-[11px] font-semibold text-amber-700">32m ago</span>
              </div>
              <p className="text-xs text-slate-600">
                Ready-to-eat meal stocks dropped below 18-hour operational threshold. Re-supply convoy en route via Route C bypass.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Shelter B Potable Water Failure</span>
                <span className="text-[11px] font-semibold text-slate-500">45m ago</span>
              </div>
              <p className="text-xs text-slate-600">
                Borehole silting incident cut off water supply to 40 families. Mobile Purification Unit 2 assigned to deliver 800 water units.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Shelter B Approaching Capacity</span>
                <span className="text-[11px] font-semibold text-slate-500">1h ago</span>
              </div>
              <p className="text-xs text-slate-600">
                Current occupancy 92%. Secondary food and bedding stores being diverted to secondary shelter site C-1.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Affected Zones & Supply Demands */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Affected Zones Supply Demands</span>
          </h2>

          <div className="space-y-3">
            {affectedSupplyZones.map((z) => (
              <div key={z.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{z.name}</span>
                  <span className="text-[11px] font-medium text-slate-500">Pop: {z.affectedPopulation}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Food Kits Needed: <strong className="text-slate-900">{z.priorityScore > 80 ? '1,200' : '650'}</strong></span>
                  <span>Water Units: <strong className="text-slate-900">{z.priorityScore > 80 ? '400' : '200'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RESCUE DEPARTMENT VIEW
 * Show:
 * - Rescue requests
 * - Boats needed
 * - People needing rescue
 * - Priority zones
 */
function RescueDepartmentView({ reports }) {
  const rescueZones = PRIORITY_ZONES;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rescue Requests</span>
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">18 Pending</div>
          <div className="text-xs text-indigo-700 font-medium">6 High-urgency calls</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Boats Needed</span>
            <Ship className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">8 Vessels</div>
          <div className="text-xs text-blue-700 font-medium">NDRF & SDRF motor crafts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">People Needing Rescue</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">340 Persons</div>
          <div className="text-xs text-rose-700 font-medium">Stranded on upper floors</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Zones</span>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">Zone A & B</div>
          <div className="text-xs text-amber-700 font-medium">3 breach points active</div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rescue Distress Calls */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-indigo-600" />
              <span>Pending Rescue Distress Reports</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              SAR Queue
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">Zone A — Sector 4: Elderly Evacuation</span>
                <span className="text-[11px] font-semibold text-rose-700">Immediate</span>
              </div>
              <p className="text-xs text-slate-600">
                Water 2+ ft inside houses. Three elderly residents immobilized near Primary School. High current prevents wading.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Route A Submerged Culvert Rescue Post</span>
                <span className="text-[11px] font-semibold text-slate-500">Active</span>
              </div>
              <p className="text-xs text-slate-600">
                Strong current across KM 42 corridor. Standby safety boat station required for stranded commuters.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Bhuragaon Embankment Breach Watch</span>
                <span className="text-[11px] font-semibold text-slate-500">Standby</span>
              </div>
              <p className="text-xs text-slate-600">
                Water level 2.1m. 2 amphibious carriers stationed on north bank for immediate evacuation protocol.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Priority Zones for Rescue */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Ship className="w-4 h-4 text-blue-600" />
            <span>Priority Zones Water Levels</span>
          </h2>

          <div className="space-y-3">
            {rescueZones.map((z) => (
              <div key={z.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{z.name} ({z.fullName})</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    z.priorityScore > 80 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Score {z.priorityScore}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Water Depth: <strong className="text-slate-900">{z.waterLevel}</strong></span>
                  <span>Boats Assigned: <strong className="text-slate-900">{z.priorityScore > 80 ? '4' : '2'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentDashboardPage;
