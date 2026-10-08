import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Info, ArrowLeft, Radio } from 'lucide-react';

export function CitizenNotificationsPage() {
  const navigate = useNavigate();

  const alerts = [
    {
      id: 'cit-notif-1',
      title: 'Morigaon Flash Flood Advisory',
      type: 'warning',
      time: '15m ago',
      desc: 'Brahmaputra tributary water gauge indicates steady increase. Residents in ground level dwellings in Sector 4 are advised to move to higher floors or Community Shelter.'
    },
    {
      id: 'cit-notif-2',
      title: 'Safe Evacuation Transit Route C Cleared',
      type: 'info',
      time: '35m ago',
      desc: 'Route A remains closed due to water inundation at KM 42. SDRF volunteers have marked Route C with emergency lighting for safe travel.'
    },
    {
      id: 'cit-notif-3',
      title: 'Water Purification Tablets Distribution',
      type: 'info',
      time: '1h ago',
      desc: 'Free potable water distribution and chlorination sachets are being handed out at Morigaon Central High School Relief Center.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/citizen/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Citizen Portal</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Community Safety Broadcasts
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Official emergency notices, flood level advisories, and relief supply schedules.
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`p-5 rounded-2xl border ${
              a.type === 'warning' ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200'
            } shadow-2xs space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {a.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm font-bold text-slate-900">{a.title}</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">{a.time}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {a.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CitizenNotificationsPage;
