import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useZones } from '../context/ZoneContext';
import { useDisaster } from '../context/DisasterContext';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

export function ZonesPage() {
  const navigate = useNavigate();
  const { zones, selectZone } = useZones();
  const { currentDisaster } = useDisaster();

  const handleZoneClick = (zoneId) => {
    selectZone(zoneId);
    navigate(`/zones/${zoneId}`);
  };

  // Human-friendly key points helper for each zone
  const getZoneKeyPoints = (zone) => {
    const points = [];
    if (zone.factors?.medicalRisk >= 0.5) points.push('Medical help needed');
    if (zone.waterShortage || zone.factors?.resourceShortage >= 0.5) points.push('Water shortage');
    if (zone.factors?.accessibilityDifficulty >= 0.5 || zone.accessStatus?.includes('Cut Off')) {
      points.push('Road access difficult');
    }
    if (points.length === 0) {
      points.push('Continuous monitoring', 'Stable supplies');
    }
    return points;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Zones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {zones.length} monitored areas for {currentDisaster.name} ({currentDisaster.region})
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {zones.map((zone) => {
          const keyPoints = getZoneKeyPoints(zone);
          const populationText = typeof zone.affectedPopulation === 'number'
            ? zone.affectedPopulation.toLocaleString()
            : zone.affectedPopulation;

          return (
            <div
              key={zone.id}
              className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-5"
            >
              <div>
                {/* Header: Zone name + status badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {zone.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {zone.fullName?.split('—')[1]?.trim() || zone.fullName}
                    </p>
                  </div>
                  <StatusBadge status={zone.priorityBand} size="sm" />
                </div>

                {/* People affected */}
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 my-3">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{populationText} people affected</span>
                </div>

                {/* Human-readable key points */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {keyPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom: Priority Score and View Zone Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Priority</span>
                  <span className="text-base font-bold text-slate-900">
                    {zone.priorityScore} / 100
                  </span>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleZoneClick(zone.id)}
                >
                  <span>View Zone</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ZonesPage;
