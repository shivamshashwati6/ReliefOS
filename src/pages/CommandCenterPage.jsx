import React, { useState } from 'react';
import KPIBar from '../components/dashboard/KPIBar';
import PriorityZones from '../components/dashboard/PriorityZones';
import MapPanel from '../components/dashboard/MapPanel';
import ResourceStatus from '../components/dashboard/ResourceStatus';
import CriticalAlerts from '../components/dashboard/CriticalAlerts';
import AIRecommendation from '../components/dashboard/AIRecommendation';
import { useDisaster } from '../context/DisasterContext';

export function CommandCenterPage({ onOpenAlerts }) {
  const { currentDisaster } = useDisaster();
  const [selectedZoneId, setSelectedZoneId] = useState('zone-a');

  const handleSelectZone = (zoneId) => {
    setSelectedZoneId(zoneId);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header: What is happening? */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {currentDisaster.name || 'Assam Flood Response'}
        </h1>
        <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
          <span>{currentDisaster.region || 'Morigaon, Assam'}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active
          </span>
          <span>•</span>
          <span className="text-slate-500">Simulation Mode</span>
        </div>
      </div>

      {/* 2. Overview: 4 primary metrics */}
      <KPIBar />

      {/* 3. Operational Grid: Priority Areas + Map + What Needs Attention */}
      <section 
        aria-label="Disaster Response Overview"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Left: Priority Areas */}
        <div className="lg:col-span-3 min-h-[460px] flex flex-col">
          <PriorityZones
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
          />
        </div>

        {/* Center: Simple Map */}
        <div className="lg:col-span-6 min-h-[460px] flex flex-col">
          <MapPanel
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
          />
        </div>

        {/* Right: What Needs Attention & Resources */}
        <div className="lg:col-span-3 grid grid-cols-1 gap-5">
          <CriticalAlerts />
          <ResourceStatus />
        </div>
      </section>

      {/* 4. Recommended Next Step */}
      <AIRecommendation />
    </div>
  );
}

export default CommandCenterPage;
