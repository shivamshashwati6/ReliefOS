import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PRIORITY_ZONES } from '../../data/demoData';
import { useZones } from '../../context/ZoneContext';
import PriorityZoneCard from './PriorityZoneCard';
import { ChevronRight } from 'lucide-react';

export function PriorityZones({ selectedZoneId, onSelectZone }) {
  const navigate = useNavigate();
  const { zones, selectZone } = useZones();

  const displayZones = zones && zones.length > 0 ? zones : PRIORITY_ZONES;

  const handleZoneClick = (zone) => {
    selectZone(zone.id);
    if (onSelectZone) {
      onSelectZone(zone.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Priority Areas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by urgency
          </p>
        </div>
      </div>

      {/* Zone Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5">
        {displayZones.map((zone) => (
          <PriorityZoneCard
            key={zone.id}
            zone={zone}
            isSelected={selectedZoneId === zone.id}
            onSelect={() => handleZoneClick(zone)}
          />
        ))}
      </div>

      {/* View all zones link */}
      <div className="pt-3 mt-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/zones')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <span>View all zones</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default PriorityZones;
