import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  FileText, 
  Sparkles, 
  Calculator, 
  HeartPulse, 
  AlertTriangle, 
  Navigation, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  ChevronDown,
  ChevronUp,
  Package,
  Droplets,
  Ship,
  Stethoscope
} from 'lucide-react';
import { useZones } from '../context/ZoneContext';
import { useReports } from '../context/ReportContext';
import { useDisaster } from '../context/DisasterContext';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import ReportCard from '../components/reports/ReportCard';

export function ZoneDetailPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { zones, getZoneById } = useZones();
  const { reports, getReportsByDisaster, updateReportStatus } = useReports();
  const { currentDisaster } = useDisaster();

  const [showCalculation, setShowCalculation] = useState(false);

  const zone = getZoneById(zoneId) || zones.find(z => z.id.toLowerCase() === zoneId?.toLowerCase()) || zones[0];

  if (!zone) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Zone Not Found</h2>
        <Button variant="default" onClick={() => navigate('/zones')}>
          Return to Zones Overview
        </Button>
      </div>
    );
  }

  // Find reports matching this zone
  const disasterReports = getReportsByDisaster(currentDisaster?.id) || [];
  const assignedReports = disasterReports.filter(r => (zone.reportIds || []).includes(r.id));

  const populationText = typeof zone.affectedPopulation === 'number'
    ? zone.affectedPopulation.toLocaleString()
    : zone.affectedPopulation;

  // Simple human factors (0-100%)
  const popFactorPct = Math.round((zone.factors?.populationImpact ?? 0.8) * 100);
  const medFactorPct = Math.round((zone.factors?.medicalRisk ?? 0.9) * 100);
  const accessFactorPct = Math.round((zone.factors?.accessibilityDifficulty ?? 0.7) * 100);

  // Requirements needed
  const neededResources = [
    { label: 'Food', amount: '1,200 kits', icon: Package },
    { label: 'Water', amount: '800 units', icon: Droplets },
    { label: 'Rescue boats', amount: '4', icon: Ship },
    { label: 'Medical teams', amount: '1', icon: Stethoscope },
  ];

  // 6 factors for calculation drawer
  const factorsList = [
    {
      key: 'populationImpact',
      label: 'Population Impact',
      weightPct: '25%',
      maxPoints: 25,
      actualPoints: zone.scoreBreakdown?.populationContribution ?? 0,
      icon: Users,
    },
    {
      key: 'severity',
      label: 'Severity Level',
      weightPct: '20%',
      maxPoints: 20,
      actualPoints: zone.scoreBreakdown?.severityContribution ?? 0,
      icon: AlertTriangle,
    },
    {
      key: 'medicalRisk',
      label: 'Medical Risk',
      weightPct: '20%',
      maxPoints: 20,
      actualPoints: zone.scoreBreakdown?.medicalContribution ?? 0,
      icon: HeartPulse,
    },
    {
      key: 'resourceShortage',
      label: 'Resource Shortage',
      weightPct: '15%',
      maxPoints: 15,
      actualPoints: zone.scoreBreakdown?.shortageContribution ?? 0,
      icon: Package,
    },
    {
      key: 'accessibilityDifficulty',
      label: 'Accessibility Difficulty',
      weightPct: '10%',
      maxPoints: 10,
      actualPoints: zone.scoreBreakdown?.accessibilityContribution ?? 0,
      icon: Navigation,
    },
    {
      key: 'vulnerability',
      label: 'Vulnerability Index',
      weightPct: '10%',
      maxPoints: 10,
      actualPoints: zone.scoreBreakdown?.vulnerabilityContribution ?? 0,
      icon: ShieldAlert,
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/zones')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors rounded p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all zones</span>
        </button>
      </div>

      {/* Header (Requirement 11) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {zone.name}
              </h1>
              <StatusBadge status={zone.priorityBand} size="sm" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {zone.fullName?.split('—')[1]?.trim() || zone.fullName}
            </p>
          </div>

          <div className="flex sm:flex-col sm:items-end justify-between items-center">
            <span className="text-xs text-slate-400">Priority score</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {zone.priorityScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </span>
          </div>
        </div>

        {/* Affected people number */}
        <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Users className="w-5 h-5 text-slate-400" />
          <span>{populationText} people affected</span>
        </div>
      </div>

      {/* WHAT'S HAPPENING? */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          WHAT'S HAPPENING?
        </h2>
        <p className="text-base text-slate-800 leading-relaxed">
          {zone.explanation || "Many people are affected by flooding. Medical help and basic supplies are needed."}
        </p>
      </div>

      {/* WHAT IS NEEDED? */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          WHAT IS NEEDED?
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {neededResources.map((res, idx) => {
            const Icon = res.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">{res.label}</span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {res.amount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WHY IS THIS ZONE IMPORTANT? */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            WHY IS THIS ZONE IMPORTANT?
          </h2>

          {/* Toggle Calculation button for judges/inspectors */}
          <button
            onClick={() => setShowCalculation(!showCalculation)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 focus:outline-none"
          >
            <span>{showCalculation ? 'Hide calculation' : 'Show calculation'}</span>
            {showCalculation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3 Simple Human Factors */}
        <div className="space-y-4">
          {/* Factor 1: People Affected */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">Many people affected</span>
              <span className="text-xs text-slate-500">{populationText} residents</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${popFactorPct}%` }}
              />
            </div>
          </div>

          {/* Factor 2: High medical need */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">High medical need</span>
              <span className="text-xs text-rose-600 font-medium">Urgent assistance</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${medFactorPct}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Limited road access */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">Limited road access</span>
              <span className="text-xs text-amber-600 font-medium">{zone.accessStatus || 'Cut Off by Road'}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${accessFactorPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expandable Mathematical Calculation Drawer */}
        {showCalculation && (
          <div className="mt-5 pt-5 border-t border-slate-200 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  System Calculation (Deterministic Breakdown)
                </span>
                <span className="text-xs font-mono text-slate-600 font-bold">
                  Total = {zone.priorityScore} / 100
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {factorsList.map((f) => (
                  <div key={f.key} className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{f.label}</span>
                      <span className="font-mono">({f.weightPct})</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {f.actualPoints} / {f.maxPoints} pts
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500">
                Formula: (Population×0.25 + Severity×0.20 + Medical×0.20 + Shortage×0.15 + Access×0.10 + Vulnerability×0.10) × 100
              </p>
            </div>

            {/* Information from reports vs System calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-950 space-y-1">
                <span className="font-semibold block">Information from reports (AI)</span>
                <p className="text-blue-800 text-[11px]">
                  Extracts raw text, flags medical emergencies, and catalogs resource mentions. Does not assign scores.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <span className="font-semibold block">System calculation (Engine)</span>
                <p className="text-emerald-800 text-[11px]">
                  Computes priority score (0–100) and priority band through transparent, deterministic weighting.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Associated Citizen Reports */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Reports from this Zone ({assignedReports.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Citizen reports mapped to {zone.name}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/report-emergency')}
          >
            Submit Report
          </Button>
        </div>

        {assignedReports.length > 0 ? (
          <div className="space-y-4">
            {assignedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onToggleStatus={updateReportStatus}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h3 className="text-xs font-semibold text-slate-700">
              No reports currently mapped
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Operating on baseline regional flood monitoring telemetry. New citizen reports submitted in {zone.name} will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ZoneDetailPage;
