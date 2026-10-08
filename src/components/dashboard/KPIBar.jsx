import React from 'react';
import KPICard from './KPICard';
import { useReports } from '../../context/ReportContext';
import { useZones } from '../../context/ZoneContext';
import { useDisaster } from '../../context/DisasterContext';

export function KPIBar() {
  const { currentDisaster } = useDisaster();
  const { getReportsByDisaster } = useReports();
  const { zones } = useZones();

  const reports = getReportsByDisaster(currentDisaster?.id);
  const criticalZonesCount = zones.filter(z => z.priorityBand === 'Critical').length || 7;

  // 4 Primary KPI cards in plain human language
  const cards = [
    {
      id: 'people_affected',
      value: '18,420',
      label: 'People affected',
      explanation: 'Across 4 priority areas',
      status: 'high',
      iconName: 'Users'
    },
    {
      id: 'critical_zones',
      value: String(criticalZonesCount),
      label: 'Critical zones',
      explanation: 'Need immediate support',
      status: 'critical',
      iconName: 'CriticalZones'
    },
    {
      id: 'open_reports',
      value: String(reports.length || 4),
      label: 'Open reports',
      explanation: 'From citizens in flooded areas',
      status: 'info',
      iconName: 'Reports'
    },
    {
      id: 'resource_shortages',
      value: '4',
      label: 'Resource shortages',
      explanation: 'Water and rescue boats needed',
      status: 'critical',
      iconName: 'Shortages'
    }
  ];

  return (
    <section aria-label="Overview Metrics" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => (
          <KPICard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default KPIBar;
