/**
 * RELIEF-OS Geographic Risk Visualization & Shelter Mapping (MapPanel)
 * 
 * Step 14 Implementation:
 * Displays canonical zone risk overlays and simulated relief shelter locations.
 * 
 * STRICT COMPLIANCE:
 * - Integrates Leaflet GIS rendering and tactical schematic river basin visualization.
 * - Zero mutation of inventories, allocations, response plans, monitoring, or safety updates.
 * - Zero AI calls.
 * - Does NOT claim shelters are real or verified.
 * - Schematic locations keep coordinates null without fabricating coordinates.
 * - Strict role security: Citizens cannot see internal priority scores or command analytics.
 * - Strict disaster isolation by active disasterId.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  Info,
  Compass,
  Navigation,
  ShieldAlert
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useDisaster } from '../../context/DisasterContext';
import { useZones } from '../../context/ZoneContext';
import { useReliefShelter } from '../../context/ReliefShelterContext';
import { useRouteEngine } from '../../context/RouteContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import { SHELTER_SAFETY_DISCLAIMER } from '../../models/reliefShelter';
import { ROAD_SEGMENT_STATUS, SIMULATED_ROAD_SAFETY_DISCLAIMER } from '../../config/routeParameters';

export function MapPanel({ selectedZoneId, onSelectZone }) {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { zones, selectZone } = useZones();
  const { shelters, calculateRemainingCapacity } = useReliefShelter();
  const routeEngine = useRouteEngine();
  const { role } = useAuth();

  const isCitizen = role === ROLES.CITIZEN;
  const canManageRoads = !isCitizen && Boolean(routeEngine?.canManageRoads);
  const segments = routeEngine?.segments || [];
  const optimalHeroRoute = routeEngine?.optimalHeroRoute;

  // View Mode: 'SCHEMATIC' (tactical river basin) or 'GIS' (interactive Leaflet)
  const [viewMode, setViewMode] = useState('SCHEMATIC');

  // Interactive filters
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [showShelters, setShowShelters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Selected item state: { type: 'ZONE' | 'SHELTER', data: Object }
  const [selectedEntityOverride, setSelectedEntityOverride] = useState(null);

  // Derived active entity without setState-in-effect
  const activeEntity = useMemo(() => {
    if (selectedEntityOverride) return selectedEntityOverride;
    if (selectedZoneId && zones.length > 0) {
      const match = zones.find(z => z.id === selectedZoneId);
      if (match) return { type: 'ZONE', data: match };
    }
    if (zones.length > 0) {
      return { type: 'ZONE', data: zones[0] };
    }
    return null;
  }, [selectedEntityOverride, selectedZoneId, zones]);

  // Filtered zones matching priorityFilter
  const filteredZones = useMemo(() => {
    return zones.filter(zone => {
      if (priorityFilter === 'ALL') return true;
      const band = String(zone.priority?.band || zone.priorityBand || '').toUpperCase();
      return band === priorityFilter;
    });
  }, [zones, priorityFilter]);

  // Color helper based on priority band
  const getPriorityColor = (band) => {
    const b = String(band || '').toLowerCase();
    if (b === 'critical') return { hex: '#ef4444', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
    if (b === 'high') return { hex: '#f97316', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (b === 'medium') return { hex: '#eab308', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { hex: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  };

  const handleZoneClick = (zone) => {
    setSelectedEntityOverride({ type: 'ZONE', data: zone });
    if (onSelectZone) onSelectZone(zone.id);
    if (selectZone) selectZone(zone.id);
  };

  const handleShelterClick = (shelter) => {
    setSelectedEntityOverride({ type: 'SHELTER', data: shelter });
  };

  const handleSegmentClick = (segment) => {
    setSelectedEntityOverride({ type: 'ROUTE_SEGMENT', data: segment });
  };

  const handleResetFilters = () => {
    setPriorityFilter('ALL');
    setShowShelters(true);
    setShowRoutes(true);
  };

  // Center coordinate for Leaflet (Morigaon, Assam region)
  const mapCenter = [26.35, 92.68];

  return (
    <div className="relative flex flex-col h-full min-h-[520px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Geographic Risk & Shelter Map</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {currentDisaster?.name || 'Active Disaster'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentDisaster?.region || 'Morigaon, Assam'} • Priority zones and simulated relief shelters
          </p>
        </div>

        {/* View Mode Toggle: Schematic vs Leaflet GIS */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode('SCHEMATIC')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'SCHEMATIC' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Basin Overview
          </button>
          <button
            type="button"
            onClick={() => setViewMode('GIS')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'GIS' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GIS Map (Leaflet)
          </button>
        </div>
      </div>

      {/* 2. FILTER BAR (Section 8) */}
      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 font-medium mr-1">Zone Filter:</span>
          
          <button
            type="button"
            onClick={() => setPriorityFilter('ALL')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              priorityFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Zones ({zones.length})
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('CRITICAL')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              priorityFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Critical
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('HIGH')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              priorityFilter === 'HIGH'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            High
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('MEDIUM')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              priorityFilter === 'MEDIUM'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
            }`}
          >
            Medium
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('LOW')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              priorityFilter === 'LOW'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Low
          </button>

          {/* Shelter Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowShelters(prev => !prev)}
            className={`ml-2 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
              showShelters
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Simulated Shelters ({shelters.length})</span>
          </button>
        </div>

        {/* Reset Filters Control */}
        <button
          type="button"
          onClick={handleResetFilters}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/60 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* 2b. ROUTE INTELLIGENCE RIBBON (Step 16) */}
      {!isCitizen && showRoutes && (
        <div className="px-3.5 py-2 bg-blue-50/70 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="font-semibold text-slate-800">Route Intelligence:</span>
            {optimalHeroRoute?.success ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  optimalHeroRoute.primaryCorridor === 'ROUTE_C'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {optimalHeroRoute.primaryCorridor === 'ROUTE_C' ? 'Route C (High Bypass)' : 'Route A (Direct)'}
                </span>
                <span className="text-slate-600">
                  {optimalHeroRoute.totalDistanceKm} km • ~{optimalHeroRoute.estimatedMinutes}m transit
                </span>
                {optimalHeroRoute.primaryCorridor === 'ROUTE_C' && (
                  <span className="text-amber-800 font-medium text-[11px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    Route A blocked at KM 42 (+10.7 km detour)
                  </span>
                )}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                All Corridors Blocked — No Navigable Route
              </span>
            )}
          </div>

          {canManageRoads && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium">Demo Simulator:</span>
              <button
                type="button"
                onClick={() => {
                  routeEngine?.blockSegment('seg-route-a-1');
                  routeEngine?.blockSegment('seg-route-a-2');
                }}
                className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-[11px] font-semibold transition cursor-pointer"
                title="Simulate Route A flood breach (Forces A* recalculation to Route C)"
              >
                Block Route A (Flood)
              </button>
              <button
                type="button"
                onClick={() => {
                  routeEngine?.openSegment('seg-route-a-1');
                  routeEngine?.openSegment('seg-route-a-2');
                }}
                className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-[11px] font-semibold transition cursor-pointer"
                title="Simulate water receding on Route A (Restores direct Route A)"
              >
                Reopen Route A
              </button>
              <button
                type="button"
                onClick={() => routeEngine?.resetToDemoBaseline()}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-blue-100 transition cursor-pointer"
                title="Reset road network to canonical state"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. MAP CANVAS (SCHEMATIC OR LEAFLET) */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden min-h-[300px]">
        {viewMode === 'GIS' ? (
          /* ============================================================ */
          /* LEAFLET INTERACTIVE GIS VIEW                                 */
          /* ============================================================ */
          <div className="w-full h-full min-h-[320px] relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={10}
              scrollWheelZoom={false}
              className="w-full h-full min-h-[320px] z-0"
              attributionControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Zone Markers on Leaflet */}
              {filteredZones.map((zone) => {
                const lat = zone.location?.lat;
                const lng = zone.location?.lng;
                if (!lat || !lng) return null;

                const band = zone.priority?.band || zone.priorityBand || 'Low';
                const color = getPriorityColor(band);
                const score = zone.priority?.score ?? zone.priorityScore ?? 0;

                return (
                  <CircleMarker
                    key={zone.id}
                    center={[lat, lng]}
                    radius={16}
                    pathOptions={{
                      color: color.hex,
                      fillColor: color.hex,
                      fillOpacity: 0.35,
                      weight: activeEntity?.data?.id === zone.id ? 4 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleZoneClick(zone),
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 space-y-1">
                        <div className="font-bold text-slate-900">{zone.fullName || zone.name}</div>
                        {!isCitizen && (
                          <div className="font-semibold text-rose-700">
                            Priority: {band} ({score})
                          </div>
                        )}
                        <div className="text-slate-600">
                          Population Affected: {zone.affectedPopulation?.toLocaleString() || 0}
                        </div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          Coordinates: {lat}°N, {lng}°E
                        </div>
                        <button
                          type="button"
                          onClick={() => handleZoneClick(zone)}
                          className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
                        >
                          Select Details
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Note for GIS mode schematic shelters */}
            {showShelters && (
              <div className="absolute top-3 right-3 z-[400] max-w-xs bg-white/95 backdrop-blur-xs border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs text-slate-700">
                <div className="flex items-start gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Simulated Shelters: </span>
                    <span>Shelter coordinates are schematic (non-physical). View them in Basin Overview or select below.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* TACTICAL SCHEMATIC RIVER BASIN SVG VIEW                      */
          /* ============================================================ */
          <svg 
            viewBox="0 0 1000 600" 
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="lightRiverBasin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.95" />
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

            {/* Background Grid */}
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
              fill="url(#lightRiverBasin)"
              stroke="#0284c7"
              strokeWidth="2.5"
            />

            <text x="140" y="275" fill="#0369a1" fontSize="13" fontWeight="600" opacity="0.85">
              Brahmaputra Flood Basin (Morigaon Sector)
            </text>

            {/* ZONE OVERLAYS & SCHEMATIC BOUNDARIES */}
            {filteredZones.map(zone => {
              const zoneId = zone.id;
              const isSelected = activeEntity?.data?.id === zoneId;
              const band = zone.priority?.band || zone.priorityBand || 'Low';
              const color = getPriorityColor(band);

              // Schematic visual anchors
              let cx = 340, cy = 270, pts = "240,210 420,190 450,330 350,370 230,310";
              let label = "A";
              if (zoneId.includes('zone-b')) {
                cx = 680; cy = 240; pts = "580,180 770,170 790,300 660,320 570,260"; label = "B";
              } else if (zoneId.includes('zone-c')) {
                cx = 800; cy = 420; pts = "720,360 890,340 920,470 790,490 690,430"; label = "C";
              } else if (zoneId.includes('zone-d')) {
                cx = 190; cy = 480; pts = "120,400 270,380 290,520 180,540 100,470"; label = "D";
              }

              return (
                <g key={zone.id}>
                  {/* Schematic Region Polygon */}
                  <polygon
                    points={pts}
                    fill={color.hex}
                    fillOpacity={isSelected ? 0.25 : 0.12}
                    stroke={color.hex}
                    strokeWidth={isSelected ? '3.5' : '1.5'}
                    strokeDasharray={isSelected ? 'none' : 'none'}
                    className="cursor-pointer transition-all hover:fill-opacity-30"
                    onClick={() => handleZoneClick(zone)}
                  />

                  {/* Schematic Marker Callout */}
                  <g 
                    transform={`translate(${cx}, ${cy})`}
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleZoneClick(zone)}
                  >
                    <circle 
                      cx="0" 
                      cy="0" 
                      r={isSelected ? "18" : "15"} 
                      fill={color.hex} 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      className="shadow-sm"
                    />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      {label}
                    </text>
                    <rect 
                      x="-44" 
                      y="18" 
                      width="88" 
                      height="20" 
                      rx="4" 
                      fill="#ffffff" 
                      stroke={color.hex} 
                      strokeWidth="1.5" 
                    />
                    <text 
                      x="0" 
                      y="32" 
                      textAnchor="middle" 
                      fill="#0f172a" 
                      fontSize="9.5" 
                      fontWeight="bold"
                    >
                      {zone.name} ({band})
                    </text>
                  </g>
                </g>
              );
            })}

            {/* RELIEF ROUTES (Step 16 Dynamic Engine) */}
            {showRoutes && !isCitizen && (
              <>
                {segments.map((seg) => {
                  const isSelected = optimalHeroRoute?.segments?.some(s => s.id === seg.id);
                  const isBlocked = seg.status === ROAD_SEGMENT_STATUS.BLOCKED;
                  const isPartial = seg.status === ROAD_SEGMENT_STATUS.PARTIAL;

                  let strokeColor = '#94a3b8'; // default available alternative
                  let strokeDash = '4,4';
                  let strokeWidth = 2.5;

                  if (isBlocked) {
                    strokeColor = '#ef4444';
                    strokeDash = '6,4';
                    strokeWidth = 3.5;
                  } else if (isSelected) {
                    if (isPartial) {
                      strokeColor = '#f59e0b';
                      strokeDash = '6,3';
                      strokeWidth = 4;
                    } else {
                      strokeColor = '#16a34a';
                      strokeDash = 'none';
                      strokeWidth = 4;
                    }
                  }

                  return (
                    <g 
                      key={seg.id} 
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => handleSegmentClick(seg)}
                    >
                      <path
                        d={seg.svgPath}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                      />
                    </g>
                  );
                })}

                {/* Route A Interactive Pill */}
                {(() => {
                  const segA1 = segments.find(s => s.id === 'seg-route-a-1');
                  const isABlocked = segA1?.status === ROAD_SEGMENT_STATUS.BLOCKED;
                  return (
                    <g 
                      transform="translate(430, 370)" 
                      className="cursor-pointer hover:scale-105 transition-transform" 
                      onClick={() => handleSegmentClick(segA1 || segments[0])}
                    >
                      {isABlocked ? (
                        <>
                          <rect x="-56" y="-11" width="112" height="20" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fill="#991b1b" fontSize="9" fontWeight="bold">Route A: Blocked (KM 42)</text>
                        </>
                      ) : (
                        <>
                          <rect x="-60" y="-11" width="120" height="20" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fill="#166534" fontSize="9" fontWeight="bold">Route A: Direct (18.5 km)</text>
                        </>
                      )}
                    </g>
                  );
                })()}

                {/* Route C Interactive Pill */}
                {(() => {
                  const segC = segments.find(s => s.id === 'seg-route-c-2');
                  const isCSelected = optimalHeroRoute?.primaryCorridor === 'ROUTE_C';
                  const isCBlocked = segC?.status === ROAD_SEGMENT_STATUS.BLOCKED;
                  return (
                    <g 
                      transform="translate(620, 395)" 
                      className="cursor-pointer hover:scale-105 transition-transform" 
                      onClick={() => handleSegmentClick(segC || segments[2])}
                    >
                      {isCBlocked ? (
                        <>
                          <rect x="-52" y="-11" width="104" height="20" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fill="#991b1b" fontSize="9" fontWeight="bold">Route C: Blocked</text>
                        </>
                      ) : isCSelected ? (
                        <>
                          <rect x="-64" y="-11" width="128" height="20" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fill="#166534" fontSize="9" fontWeight="bold">Route C: Selected ({optimalHeroRoute?.totalDistanceKm || 29.2} km)</text>
                        </>
                      ) : (
                        <>
                          <rect x="-60" y="-11" width="120" height="20" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                          <text x="0" y="3" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">Route C: Alternative Bypass</text>
                        </>
                      )}
                    </g>
                  );
                })()}
              </>
            )}

            {/* SIMULATED SHELTERS (Section 5) */}
            {showShelters && shelters.map((sh, idx) => {
              const isSelected = activeEntity?.data?.shelterId === sh.shelterId;
              // Schematic visual anchors for simulated shelters
              const coords = [
                { x: 380, y: 170 }, // Sector 4
                { x: 740, y: 160 }, // Nagaon
                { x: 860, y: 350 }, // Kaliabor
                { x: 170, y: 390 }, // Dhing
              ];
              const pt = coords[idx % coords.length];

              return (
                <g 
                  key={sh.shelterId}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => handleShelterClick(sh)}
                >
                  <circle 
                    cx="0" 
                    cy="0" 
                    r={isSelected ? "16" : "13"} 
                    fill="#2563eb" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" 
                  />
                  <polygon points="0,-6 6,2 -6,2" fill="#ffffff" />
                  <rect x="-42" y="16" width="84" height="18" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
                  <text x="0" y="28" textAnchor="middle" fill="#1e3a8a" fontSize="8.5" fontWeight="bold">
                    {sh.name.split(' ')[0]} (Sim)
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* EMPTY STATE IF ALL ZONES FILTERED OUT */}
        {filteredZones.length === 0 && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center p-6 text-center">
            <div className="max-w-xs space-y-2">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No zones match filter ({priorityFilter})</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE IF NO SHELTERS EXIST FOR THIS DISASTER (Section 9) */}
        {showShelters && shelters.length === 0 && (
          <div className="absolute top-3 left-3 z-10 max-w-sm bg-white/95 border border-slate-200 p-3 rounded-lg shadow-xs text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block mb-0.5">Simulated Shelters:</span>
            <span>No simulated shelter points have been configured for this disaster.</span>
          </div>
        )}
      </div>

      {/* 4. SELECTED ZONE OR SHELTER DETAIL CARD (Section 6) */}
      {activeEntity && (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2">
          {activeEntity.type === 'ZONE' ? (
            /* Selected Zone Details */
            (() => {
              const zone = activeEntity.data;
              const band = zone.priority?.band || zone.priorityBand || 'Low';
              const score = zone.priority?.score ?? zone.priorityScore ?? 0;
              const color = getPriorityColor(band);
              const lat = zone.location?.lat;
              const lng = zone.location?.lng;

              return (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {zone.fullName || zone.name}
                      </span>
                      {!isCitizen ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${color.bg} ${color.text} border ${color.border}`}>
                          {band} Priority ({score})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Monitored Emergency Sector
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                      <span><strong>People Affected:</strong> {zone.affectedPopulation?.toLocaleString() || 0}</span>
                      <span><strong>Access Status:</strong> {zone.accessStatus || 'Normal Access'}</span>
                      {!isCitizen && (
                        <span><strong>Medical Risk:</strong> {zone.baselineMedicalRisk >= 0.5 ? 'High (Triage Priority)' : 'Managed'}</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      {lat && lng ? (
                        <span>Documented Coordinates: {lat}°N, {lng}°E</span>
                      ) : (
                        <span className="text-amber-700 font-sans">
                          Geographic coordinates are unavailable for this zone. Showing schematic information only.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/zones/${zone.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-2xs"
                    >
                      <span>View Zone Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()
          ) : activeEntity.type === 'ROUTE_SEGMENT' ? (
            /* Selected Route Segment Details (Step 16) */
            (() => {
              const seg = activeEntity.data;
              return (
                <div className="space-y-2.5 text-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        <Navigation className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{seg.name}</span>
                        <span className="ml-2 text-slate-500 font-mono text-[11px]">• Corridor: {seg.routeCode}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        seg.status === ROAD_SEGMENT_STATUS.BLOCKED ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        seg.status === ROAD_SEGMENT_STATUS.PARTIAL ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {seg.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <span>Length: <strong>{seg.distanceKm} km</strong></span>
                      <span>•</span>
                      <span>Surface: <strong>{seg.surface}</strong></span>
                    </div>
                  </div>

                  <div className="text-slate-600">
                    <strong>Reported Road Condition:</strong> {seg.condition}
                  </div>

                  {canManageRoads ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium">Command Status Override:</span>
                      <button
                        type="button"
                        onClick={() => routeEngine?.setSegmentStatus(seg.id, ROAD_SEGMENT_STATUS.BLOCKED)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                          seg.status === ROAD_SEGMENT_STATUS.BLOCKED 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        Mark Blocked
                      </button>
                      <button
                        type="button"
                        onClick={() => routeEngine?.setSegmentStatus(seg.id, ROAD_SEGMENT_STATUS.PARTIAL)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                          seg.status === ROAD_SEGMENT_STATUS.PARTIAL 
                            ? 'bg-amber-500 text-white border-amber-500' 
                            : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        Mark Partial Caution
                      </button>
                      <button
                        type="button"
                        onClick={() => routeEngine?.setSegmentStatus(seg.id, ROAD_SEGMENT_STATUS.OPEN)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                          seg.status === ROAD_SEGMENT_STATUS.OPEN 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        Mark Open / Cleared
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Read-only simulated road segment status. Command Center authorization required to alter road blockage status.
                    </div>
                  )}

                  {/* Safety Disclaimer Banner */}
                  <div className="p-2 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[11px]">
                    <strong>{SIMULATED_ROAD_SAFETY_DISCLAIMER}</strong>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Selected Shelter Details (Section 5 & 6) */
            (() => {
              const sh = activeEntity.data;
              const remaining = calculateRemainingCapacity(sh);

              return (
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        <Home className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{sh.name}</span>
                        <span className="ml-2 text-slate-500">• {sh.area}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Simulated Point
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <span>Capacity: <strong>{sh.capacity}</strong></span>
                      <span>•</span>
                      <span>Occupancy: <strong>{sh.occupancy}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{remaining} available</span>
                    </div>
                  </div>

                  {/* Services Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-slate-500 font-medium">Services:</span>
                    {sh.services.map((svc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-white border border-slate-200 text-slate-700 font-medium">
                        {svc}
                      </span>
                    ))}
                  </div>

                  {/* Safety Disclaimer Banner (Section 5) */}
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <strong>{SHELTER_SAFETY_DISCLAIMER}</strong>
                      <span className="block text-amber-800 mt-0.5">
                        Schematic point for operational modeling. Direct routing is unavailable without authorized transport clearance.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 5. CLEAN MAP LEGEND (Section 2) */}
      <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Simulated Shelter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600" />
              <span>Selected Corridor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 border-dashed" />
              <span>Alternative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border-dashed" />
              <span>Partial Caution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-dashed" />
              <span>Blocked Route</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Simulated disaster response environment
          </span>
        </div>
      </div>
    </div>
  );
}

export default MapPanel;
