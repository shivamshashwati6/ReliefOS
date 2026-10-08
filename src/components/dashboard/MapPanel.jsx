import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Crosshair, 
  MapPin,
  Home,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';

export function MapPanel({ selectedZoneId, onSelectZone }) {
  const { currentDisaster } = useDisaster();
  const [activeLayers, setActiveLayers] = useState({
    zones: true,
    shelters: true,
    routes: true,
  });

  const toggleLayer = (layerKey) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="relative flex flex-col h-full min-h-[460px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Top Map Header */}
      <div className="p-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 z-10">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>Disaster Map</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentDisaster.region || 'Morigaon, Assam'} • Affected areas & relief routes
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => toggleLayer('zones')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeLayers.zones ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Affected areas
          </button>
          <button
            onClick={() => toggleLayer('shelters')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeLayers.shelters ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Shelters
          </button>
          <button
            onClick={() => toggleLayer('routes')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeLayers.routes ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Relief routes
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden select-none">
        <svg 
          viewBox="0 0 1000 600" 
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* River Gradient */}
            <linearGradient id="lightRiver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.9" />
            </linearGradient>

            <radialGradient id="critZoneLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fee2e2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fecaca" stopOpacity="0.3" />
            </radialGradient>

            <radialGradient id="highZoneLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.3" />
            </radialGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="200" y1="0" x2="200" y2="600" stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1="400" y1="0" x2="400" y2="600" stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1="600" y1="0" x2="600" y2="600" stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1="800" y1="0" x2="800" y2="600" stroke="#e2e8f0" strokeDasharray="4,4" />

          <line x1="0" y1="150" x2="1000" y2="150" stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1="0" y1="300" x2="1000" y2="300" stroke="#e2e8f0" strokeDasharray="4,4" />
          <line x1="0" y1="450" x2="1000" y2="450" stroke="#e2e8f0" strokeDasharray="4,4" />

          {/* River Basin Flow */}
          <path
            d="M -20,220 C 180,180 320,310 500,240 C 680,170 820,290 1020,220 L 1020,380 C 820,440 650,330 480,390 C 310,450 160,340 -20,400 Z"
            fill="url(#lightRiver)"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* River Label */}
          <text x="140" y="275" fill="#0369a1" fontSize="13" fontWeight="600" opacity="0.8">
            Brahmaputra Flood Basin
          </text>

          {/* ZONE POLYGONS */}
          {activeLayers.zones && (
            <>
              {/* Zone A: Critical */}
              <circle cx="340" cy="270" r="105" fill="url(#critZoneLight)" />
              <polygon
                points="240,210 420,190 450,330 350,370 230,310"
                fill="#ef4444"
                fillOpacity="0.12"
                stroke="#dc2626"
                strokeWidth={selectedZoneId === 'zone-a' ? '3' : '1.5'}
                className="cursor-pointer transition-all"
                onClick={() => onSelectZone && onSelectZone('zone-a')}
              />

              {/* Zone B: High */}
              <circle cx="680" cy="240" r="95" fill="url(#highZoneLight)" />
              <polygon
                points="580,180 770,170 790,300 660,320 570,260"
                fill="#f97316"
                fillOpacity="0.12"
                stroke="#ea580c"
                strokeWidth={selectedZoneId === 'zone-b' ? '3' : '1.5'}
                className="cursor-pointer transition-all"
                onClick={() => onSelectZone && onSelectZone('zone-b')}
              />

              {/* Zone C: Medium */}
              <polygon
                points="720,360 890,340 920,470 790,490 690,430"
                fill="#eab308"
                fillOpacity="0.1"
                stroke="#ca8a04"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onClick={() => onSelectZone && onSelectZone('zone-c')}
              />

              {/* Zone D: Low */}
              <polygon
                points="120,400 270,380 290,520 180,540 100,470"
                fill="#10b981"
                fillOpacity="0.1"
                stroke="#059669"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onClick={() => onSelectZone && onSelectZone('zone-d')}
              />
            </>
          )}

          {/* ROUTES */}
          {activeLayers.routes && (
            <>
              {/* Route A: Blocked */}
              <path
                d="M 520,490 L 460,400 L 410,340 L 340,270"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                strokeDasharray="6,4"
              />

              {/* Route C: Active Relief Corridor */}
              <path
                d="M 520,490 L 620,470 L 590,360 L 470,220 L 370,240 L 340,270"
                fill="none"
                stroke="#16a34a"
                strokeWidth="3.5"
              />
            </>
          )}

          {/* SHELTERS */}
          {activeLayers.shelters && (
            <>
              {/* Shelter B1 */}
              <g transform="translate(680, 210)">
                <circle cx="0" cy="0" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2" shadow="sm" />
                <polygon points="0,-6 6,3 -6,3" fill="#ffffff" />
                <rect x="-35" y="16" width="70" height="16" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="0" y="28" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">Shelter B</text>
              </g>

              {/* Shelter D1 */}
              <g transform="translate(190, 460)">
                <circle cx="0" cy="0" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <polygon points="0,-6 6,3 -6,3" fill="#ffffff" />
                <rect x="-35" y="16" width="70" height="16" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="0" y="28" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">Shelter D</text>
              </g>
            </>
          )}

          {/* ZONE LABELS */}
          {activeLayers.zones && (
            <>
              {/* Zone A */}
              <g 
                transform="translate(340, 270)" 
                className="cursor-pointer"
                onClick={() => onSelectZone && onSelectZone('zone-a')}
              >
                <circle cx="0" cy="0" r="16" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">A</text>
                <rect x="-42" y="20" width="84" height="20" rx="4" fill="#ffffff" stroke="#fca5a5" strokeWidth="1" />
                <text x="0" y="34" textAnchor="middle" fill="#b91c1c" fontSize="10" fontWeight="bold">Zone A (Critical)</text>
              </g>

              {/* Zone B */}
              <g 
                transform="translate(680, 250)" 
                className="cursor-pointer"
                onClick={() => onSelectZone && onSelectZone('zone-b')}
              >
                <circle cx="0" cy="0" r="15" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">B</text>
                <rect x="-40" y="18" width="80" height="19" rx="4" fill="#ffffff" stroke="#fed7aa" strokeWidth="1" />
                <text x="0" y="32" textAnchor="middle" fill="#c2410c" fontSize="9" fontWeight="bold">Zone B (High)</text>
              </g>

              {/* Zone C */}
              <g 
                transform="translate(800, 420)" 
                className="cursor-pointer"
                onClick={() => onSelectZone && onSelectZone('zone-c')}
              >
                <circle cx="0" cy="0" r="14" fill="#ca8a04" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">C</text>
                <rect x="-40" y="18" width="80" height="19" rx="4" fill="#ffffff" stroke="#fef08a" strokeWidth="1" />
                <text x="0" y="32" textAnchor="middle" fill="#854d0e" fontSize="9" fontWeight="bold">Zone C (Medium)</text>
              </g>

              {/* Zone D */}
              <g 
                transform="translate(190, 480)" 
                className="cursor-pointer"
                onClick={() => onSelectZone && onSelectZone('zone-d')}
              >
                <circle cx="0" cy="0" r="14" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">D</text>
                <rect x="-38" y="18" width="76" height="19" rx="4" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1" />
                <text x="0" y="32" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="bold">Zone D (Low)</text>
              </g>
            </>
          )}

          {/* Route Status Labels */}
          {activeLayers.routes && (
            <>
              {/* Route A Callout */}
              <g transform="translate(430, 370)">
                <rect x="-48" y="-11" width="96" height="20" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#991b1b" fontSize="9" fontWeight="bold">Route A: Blocked</text>
              </g>

              {/* Route C Callout */}
              <g transform="translate(620, 395)">
                <rect x="-52" y="-11" width="104" height="20" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#166534" fontSize="9" fontWeight="bold">Route C: Open Relief</text>
              </g>
            </>
          )}
        </svg>

        {/* Floating Zoom Buttons */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-xs">
          <button
            title="Zoom In"
            className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            title="Zoom Out"
            className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simple Clean Legend */}
      <div className="p-3 bg-white border-t border-slate-100 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical area (Zone A)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>High priority (Zone B)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Shelters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-500 rounded" />
            <span>Open route (Route C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-red-500 rounded border-dashed" />
            <span>Blocked route (Route A)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPanel;
