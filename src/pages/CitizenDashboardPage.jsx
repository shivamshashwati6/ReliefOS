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
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import { useDisaster } from '../context/DisasterContext';

export function CitizenDashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reports } = useReports();
  const { currentDisaster } = useDisaster();

  // Citizen's personal reports (for prototype, show recent reports or simulated resident submissions)
  const citizenReports = reports.slice(0, 3);

  const emergencyHelplines = [
    { name: 'National Emergency', number: '112', desc: 'Police, Fire & General Rescue' },
    { name: 'Medical & Ambulance', number: '108', desc: 'Emergency Medical Service' },
    { name: 'Disaster Helpline', number: '1070', desc: 'State Disaster Management Control' },
  ];

  const nearbyShelters = [
    {
      name: 'Morigaon Central High School Shelter',
      distance: '0.8 km away',
      address: 'Main Road, Sector 2',
      services: ['Clean Water', 'Medical First Aid', 'Dry Rations'],
      status: 'Open & Accessible',
      open: true
    },
    {
      name: 'Community Hall Relief Point B',
      distance: '1.4 km away',
      address: 'Near Old Bus Stand',
      services: ['Drinking Water', 'Shelter Beds'],
      status: 'Open (High Occupancy)',
      open: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header: Welcome back */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Citizen Emergency Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser?.name || 'Resident'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay informed on local flood conditions in <span className="font-medium text-slate-700">{currentDisaster?.region || 'Morigaon, Assam'}</span> and request urgent assistance.
          </p>
        </div>

        {/* Primary Call to Action */}
        <div className="shrink-0">
          <button
            onClick={() => navigate('/report-emergency')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 group cursor-pointer"
          >
            <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
            <span>Report an Emergency</span>
            <ArrowRight className="w-4 h-4 text-red-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. Main Operational Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Card 1: Emergency Report Quick Action */}
        <div className="lg:col-span-12 bg-linear-to-r from-red-50 via-white to-amber-50 rounded-2xl border border-red-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Are you or someone nearby in immediate danger?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Submit an urgent report for medical help, flood evacuation, or food and clean drinking water supplies. Teams on duty will be notified immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/report-emergency')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-xs transition-colors shrink-0 text-center"
          >
            Report an Emergency
          </button>
        </div>

        {/* Card 2: My Reports */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base text-slate-900">My Reports</h2>
            </div>
            <button
              onClick={() => navigate('/reports/my')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {citizenReports.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No reports submitted yet. Use the button above if you need assistance.
              </div>
            ) : (
              citizenReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{report.id}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                      <Clock className="w-3 h-3" />
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {report.location || 'Local Sector'}
                    </span>
                    <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Reports Needing Attention / Community Advisories */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-base text-slate-900">Reports Needing Attention</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Community Notices
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sector 4 Water Inundation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Water has risen inside ground-floor residences near Primary School. Families requiring evacuation assistance should move toward higher ground or designated shelter points.
              </p>
              <div className="text-[11px] font-medium text-amber-700 pt-1">
                Active notice • Verified by local volunteers
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Route A Submerged — Use Route C</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The main connecting culvert on Route A is completely submerged. Please do not drive small vehicles. Pedestrian movement diverted toward Route C high bypass.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Nearby Help & Helplines */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base text-slate-900">Nearby Help & Relief Centers</h2>
            </div>
            <button
              onClick={() => navigate('/citizen/help')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Centers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Helplines */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Emergency Helplines
              </span>
              <div className="space-y-2">
                {emergencyHelplines.map((line) => (
                  <div key={line.number} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{line.name}</div>
                      <div className="text-[10px] text-slate-500">{line.desc}</div>
                    </div>
                    <a
                      href={`tel:${line.number}`}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1 hover:bg-blue-100"
                    >
                      <PhoneCall className="w-3 h-3" />
                      {line.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Shelters */}
            {nearbyShelters.map((shelter) => (
              <div key={shelter.name} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{shelter.name}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      {shelter.distance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {shelter.address}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {shelter.services.map((srv) => (
                      <span key={srv} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {shelter.status}
                  </span>
                  <button
                    onClick={() => navigate('/citizen/help')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Directions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CitizenDashboardPage;
