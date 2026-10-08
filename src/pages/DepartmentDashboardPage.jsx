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
  Activity,
  ArrowRight,
  Clock,
  Droplet,
  Ship,
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDisaster } from '../context/DisasterContext';
import { useReports } from '../context/ReportContext';
import { PRIORITY_ZONES } from '../data/demoData';
import { DEPARTMENTS } from '../config/roles';
import StatusBadge from '../components/ui/StatusBadge';
import DepartmentAllocationCard from '../components/dashboard/DepartmentAllocationCard';

export function DepartmentDashboardPage() {
  const { currentUser } = useAuth();
  const { currentDisaster } = useDisaster();
  const { reports } = useReports();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active department: from route subpath or user's department, fallback to HEALTH
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
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeDept === DEPARTMENTS.HEALTH && 'Health Response'}
              {activeDept === DEPARTMENTS.FOOD_SUPPLY && 'Food & Supply Response'}
              {activeDept === DEPARTMENTS.RESCUE && 'Rescue Response'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Information relevant to your department.
            </p>
          </div>

          {/* Department Quick Switcher Tabs (For demo ease) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveDept(DEPARTMENTS.HEALTH)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeDept === DEPARTMENTS.HEALTH
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Health</span>
            </button>
            <button
              onClick={() => setActiveDept(DEPARTMENTS.FOOD_SUPPLY)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeDept === DEPARTMENTS.FOOD_SUPPLY
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Food & Supply</span>
            </button>
            <button
              onClick={() => setActiveDept(DEPARTMENTS.RESCUE)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeDept === DEPARTMENTS.RESCUE
                  ? 'bg-white text-blue-700 shadow-2xs'
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
        <HealthDepartmentView />
      )}

      {activeDept === DEPARTMENTS.FOOD_SUPPLY && (
        <FoodSupplyDepartmentView />
      )}

      {activeDept === DEPARTMENTS.RESCUE && (
        <RescueDepartmentView />
      )}
    </div>
  );
}

/**
 * HEALTH DEPARTMENT VIEW
 * Title: Health Response
 * Overview cards: Medical emergencies, Medical teams needed, Medicine needs, Critical health zones
 * What Needs Attention?: Medical help requested in Zone A, Multiple people reported injuries, Medical team needed
 * Priority Zones: Zone A Critical High medical need, Zone B High Medical support requested
 */
function HealthDepartmentView() {
  const navigate = useNavigate();

  const overviewCards = [
    { label: 'Medical emergencies', value: '14 Active', sub: '3 triage cases pending', icon: HeartPulse, color: 'text-rose-600' },
    { label: 'Medical teams needed', value: '5 Teams', sub: '2 teams on duty in Morigaon', icon: Users, color: 'text-blue-600' },
    { label: 'Medicine level', value: 'HIGH Need', sub: 'Urgent medical kits & ORS', icon: Activity, color: 'text-purple-600' },
    { label: 'Critical health zones', value: '2 Zones', sub: 'Zone A and Zone B', icon: AlertTriangle, color: 'text-amber-600' }
  ];

  const attentionItems = [
    {
      id: 'h-att-1',
      title: 'Medical help requested in Zone A',
      detail: 'Infant dehydration and fever cases reported near Community Shelter.',
      severity: 'Critical',
      time: '18m ago'
    },
    {
      id: 'h-att-2',
      title: 'Multiple people reported injuries',
      detail: 'Cuts and trauma reported during building evacuation near Primary School.',
      severity: 'High',
      time: '25m ago'
    },
    {
      id: 'h-att-3',
      title: 'Medical team needed',
      detail: 'Sector 4 relief camp has requested an additional field doctor on duty.',
      severity: 'High',
      time: '40m ago'
    }
  ];

  const priorityZones = [
    {
      id: 'zone-a',
      name: 'Zone A',
      severity: 'Critical',
      note: 'High medical need',
      detail: '3,842 people affected • Urgent medical kits required'
    },
    {
      id: 'zone-b',
      name: 'Zone B',
      severity: 'High',
      note: 'Medical support requested',
      detail: '2,100 people affected • Mobile clinic on standby'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Grid: What Needs Attention? & Priority Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What Needs Attention? */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              What Needs Attention?
            </h2>
            <span className="text-xs text-slate-500">
              Health Issues
            </span>
          </div>

          <div className="space-y-3">
            {attentionItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <StatusBadge status={item.severity} size="xs" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                <div className="text-[11px] text-slate-400">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Priority Zones */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Priority Zones
              </h2>
              <span className="text-xs text-slate-500">
                Medical Status
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {priorityZones.map((z) => (
                <div key={z.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{z.name}</span>
                    <StatusBadge status={z.severity} size="xs" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {z.note}
                  </div>
                  <div className="text-xs text-slate-500">
                    {z.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/zones')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <span>View all zones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Medical Team Allocations (Step 8 Read-Only) */}
      <DepartmentAllocationCard department={DEPARTMENTS.HEALTH} />
    </div>
  );
}

/**
 * FOOD & SUPPLY DEPARTMENT VIEW
 * Title: Food & Supply Response
 * Overview: Food needed, Water needed, Supply shortages, Affected zones
 * What Needs Attention?: Water shortage in Zone A, Food shortage in Zone B, Supply access blocked
 * Priority Zones: Zone A Critical High food & water shortage, Zone B High Food support requested
 */
function FoodSupplyDepartmentView() {
  const navigate = useNavigate();

  const overviewCards = [
    { label: 'Food needed', value: '4,200 Kits', sub: 'Dry rations & ready meals', icon: Package, color: 'text-amber-600' },
    { label: 'Water needed', value: '12,000 L', sub: 'Potable water supply', icon: Droplet, color: 'text-blue-600' },
    { label: 'Supply shortages', value: '4 Shortages', sub: 'Drinking water and kits', icon: AlertTriangle, color: 'text-rose-600' },
    { label: 'Affected zones', value: '4 Zones', sub: '18,420 people affected', icon: MapPin, color: 'text-emerald-600' }
  ];

  const attentionItems = [
    {
      id: 'fs-att-1',
      title: 'Water shortage in Zone A',
      detail: 'Drinking water tap points contaminated. Clean bottles urgently requested.',
      severity: 'Critical',
      time: '20m ago'
    },
    {
      id: 'fs-att-2',
      title: 'Food shortage in Zone B',
      detail: 'Local shelter food supply depleted; 150 meal packets needed.',
      severity: 'High',
      time: '35m ago'
    },
    {
      id: 'fs-att-3',
      title: 'Supply access blocked',
      detail: 'Route A flooded; supply trucks rerouted via Route C high bypass.',
      severity: 'High',
      time: '50m ago'
    }
  ];

  const priorityZones = [
    {
      id: 'zone-a',
      name: 'Zone A',
      severity: 'Critical',
      note: 'High food and water shortage',
      detail: '3,842 people affected • Water delivery convoy en route'
    },
    {
      id: 'zone-b',
      name: 'Zone B',
      severity: 'High',
      note: 'Food support requested',
      detail: '2,100 people affected • Secondary distribution scheduled'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Grid: What Needs Attention? & Priority Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What Needs Attention? */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              What Needs Attention?
            </h2>
            <span className="text-xs text-slate-500">
              Supply Needs
            </span>
          </div>

          <div className="space-y-3">
            {attentionItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <StatusBadge status={item.severity} size="xs" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                <div className="text-[11px] text-slate-400">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Priority Zones */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Priority Zones
              </h2>
              <span className="text-xs text-slate-500">
                Supply Demands
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {priorityZones.map((z) => (
                <div key={z.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{z.name}</span>
                    <StatusBadge status={z.severity} size="xs" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {z.note}
                  </div>
                  <div className="text-xs text-slate-500">
                    {z.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/zones')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <span>View all zones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Food & Water Allocations (Step 8 Read-Only) */}
      <DepartmentAllocationCard department={DEPARTMENTS.FOOD_SUPPLY} />
    </div>
  );
}

/**
 * RESCUE DEPARTMENT VIEW
 * Title: Rescue Response
 * Overview: Rescue requests, Boats needed, People needing rescue, Priority zones
 * What Needs Attention?: People stranded in Zone A, Rescue boats needed, Road access difficult
 * Priority Zones: Zone A Critical People stranded & boats needed, Zone B High Rescue boats requested
 */
function RescueDepartmentView() {
  const navigate = useNavigate();

  const overviewCards = [
    { label: 'Rescue requests', value: '18 Requests', sub: '6 immediate response needed', icon: LifeBuoy, color: 'text-blue-600' },
    { label: 'Boats needed', value: '8 Boats', sub: 'Motorized flood crafts', icon: Ship, color: 'text-indigo-600' },
    { label: 'People needing rescue', value: '340 People', sub: 'In flooded sectors', icon: Users, color: 'text-rose-600' },
    { label: 'Priority zones', value: '2 Zones', sub: 'Zone A and Zone B', icon: ShieldAlert, color: 'text-amber-600' }
  ];

  const attentionItems = [
    {
      id: 'res-att-1',
      title: 'People stranded in Zone A',
      detail: 'Families trapped on upper floors near primary school with rising water.',
      severity: 'Critical',
      time: '12m ago'
    },
    {
      id: 'res-att-2',
      title: 'Rescue boats needed',
      detail: 'NDRF team requesting 4 additional motor vessels for Sector 4 evacuation.',
      severity: 'Critical',
      time: '28m ago'
    },
    {
      id: 'res-att-3',
      title: 'Road access difficult',
      detail: 'Main culvert submerged by 2.4 ft water; only amphibious craft can pass.',
      severity: 'High',
      time: '45m ago'
    }
  ];

  const priorityZones = [
    {
      id: 'zone-a',
      name: 'Zone A',
      severity: 'Critical',
      note: 'People stranded & boats needed',
      detail: '3,842 people affected • 4 rescue boats deployed'
    },
    {
      id: 'zone-b',
      name: 'Zone B',
      severity: 'High',
      note: 'Rescue boats requested',
      detail: '2,100 people affected • Standby boat post established'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Grid: What Needs Attention? & Priority Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What Needs Attention? */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              What Needs Attention?
            </h2>
            <span className="text-xs text-slate-500">
              Rescue Alerts
            </span>
          </div>

          <div className="space-y-3">
            {attentionItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <StatusBadge status={item.severity} size="xs" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                <div className="text-[11px] text-slate-400">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Priority Zones */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Priority Zones
              </h2>
              <span className="text-xs text-slate-500">
                Rescue Operations
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {priorityZones.map((z) => (
                <div key={z.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{z.name}</span>
                    <StatusBadge status={z.severity} size="xs" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {z.note}
                  </div>
                  <div className="text-xs text-slate-500">
                    {z.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/zones')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <span>View all zones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Rescue Boat Allocations (Step 8 Read-Only) */}
      <DepartmentAllocationCard department={DEPARTMENTS.RESCUE} />
    </div>
  );
}

export default DepartmentDashboardPage;
