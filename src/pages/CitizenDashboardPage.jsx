import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertOctagon, 
  FileText, 
  LifeBuoy, 
  MapPin, 
  PhoneCall, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Info,
  AlertTriangle,
  Stethoscope,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { useDisaster } from '../context/DisasterContext';
import StatusBadge from '../components/ui/StatusBadge';

export function CitizenDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reports } = useReports();
  const { currentDisaster } = useDisaster();

  // Citizen's personal reports list
  const citizenReports = reports.slice(0, 2);
  const reportCount = citizenReports.length || 2;
  const latestReport = citizenReports[0] || {
    id: 'REP-101',
    description: 'Water entered our house. Need assistance with food and clean drinking water.',
    status: 'Under review'
  };

  // 2-3 Simple safety updates with clear severity indicators (Section 4C)
  const safetyUpdates = [
    {
      id: 'up-1',
      title: 'Water level is rising in Sector 4.',
      detail: 'Water entering ground-level houses near the primary school. Residents should move to higher ground.',
      severity: 'High',
      time: '15m ago'
    },
    {
      id: 'up-2',
      title: 'Route A is currently flooded.',
      detail: 'The culvert road is submerged. Do not attempt to cross with vehicles. Use Route C bypass instead.',
      severity: 'Critical',
      time: '30m ago'
    },
    {
      id: 'up-3',
      title: 'Route C is open for safe pedestrian bypass.',
      detail: 'High ground route marked with markers and volunteer stations.',
      severity: 'Low',
      time: '45m ago'
    }
  ];

  const emergencyNumbers = [
    { name: 'National Emergency', number: '112' },
    { name: 'Medical Help', number: '108' },
    { name: 'Disaster Helpline', number: '1070' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header: Welcome back */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay informed and get help when you need it.
          </p>
        </div>

        {/* Primary action in header */}
        <div className="shrink-0">
          <button
            onClick={() => navigate('/report-emergency')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>Report an Emergency</span>
          </button>
        </div>
      </div>

      {/* A. Emergency Action Card */}
      <section aria-label="Emergency Action">
        <div className="bg-white rounded-xl border border-red-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Need help?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Report an emergency so the response team can assist you.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/report-emergency')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shrink-0 text-center cursor-pointer"
          >
            Report an Emergency
          </button>
        </div>
      </section>

      {/* Grid: B. My Reports & C. Safety Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* B. My Reports */}
        <section aria-label="My Reports" className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-base text-slate-900">My Reports</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {reportCount} reports
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3">
                <div>
                  <span className="text-xs text-slate-500 font-medium block mb-1">Latest:</span>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    "{latestReport.description?.includes('Water') ? 'Water entered our house' : latestReport.description || 'Water entered our house'}"
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" />
                    {latestReport.status === 'New' ? 'Under review' : latestReport.status || 'Under review'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate('/reports/my')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              <span>View My Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* C. Safety Updates */}
        <section aria-label="Safety Updates" className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-base text-slate-900">Safety Updates</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Local Notices
            </span>
          </div>

          <div className="space-y-3">
            {safetyUpdates.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {alert.title}
                  </span>
                  <StatusBadge status={alert.severity} size="xs" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {alert.detail}
                </p>
                <div className="text-[11px] text-slate-400 pt-0.5">
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* D. Nearby Help */}
      <section aria-label="Nearby Help" className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Nearby Help</h2>
          </div>
          <button
            onClick={() => navigate('/citizen/help')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Nearby Help</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Shelter */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Building className="w-4 h-4 text-slate-500" />
              <span>Shelter</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Morigaon High School Shelter
            </div>
            <div className="text-xs text-slate-600">
              Main Road, Sector 2 • 0.8 km away
            </div>
            <div className="pt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Open & Accessible</span>
            </div>
          </div>

          {/* 2. Medical Help */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-rose-500" />
              <span>Medical Help</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Civil Hospital Aid Post
            </div>
            <div className="text-xs text-slate-600">
              Old Bus Stand Ward • 1.2 km away
            </div>
            <div className="pt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Doctor on duty • Open 24/7</span>
            </div>
          </div>

          {/* 3. Emergency Numbers */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <PhoneCall className="w-4 h-4 text-blue-500" />
              <span>Emergency Numbers</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {emergencyNumbers.map((item) => (
                <div key={item.number} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{item.name}</span>
                  <a
                    href={`tel:${item.number}`}
                    className="font-bold text-blue-700 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-blue-50"
                  >
                    {item.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default CitizenDashboardPage;
