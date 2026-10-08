import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, MapPin, PhoneCall, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';

export function CitizenHelpPage() {
  const navigate = useNavigate();

  const helplines = [
    { name: 'National Emergency Service', number: '112', desc: 'Police, Fire and Ambulance integration' },
    { name: 'Disaster Emergency Helpline', number: '1070', desc: 'State Disaster Management Authority (ASDMA)' },
    { name: 'Emergency Medical Service', number: '108', desc: 'Medical transport & field paramedic dispatch' },
    { name: 'Morigaon Control Room', number: '03678-240225', desc: 'District Commissioner Emergency Ops Desk' },
  ];

  const shelters = [
    {
      id: 'sh-1',
      name: 'Morigaon Central High School Relief Center',
      distance: '0.8 km',
      address: 'Main Road, Sector 2, Morigaon',
      capacity: '320 / 400 persons',
      facilities: ['Drinking Water Tank', 'Medical First Aid Post', 'Mobile Phone Charging', 'Dry Ration Kits'],
      status: 'Open & Accepting Residents'
    },
    {
      id: 'sh-2',
      name: 'Community Hall Relief Point B',
      distance: '1.4 km',
      address: 'Near Old Bus Stand, Ward 4',
      capacity: '190 / 200 persons',
      facilities: ['Water Purification Sachet Station', 'Shelter Bedding', 'Sanitation Blocks'],
      status: 'Near Full Capacity'
    },
    {
      id: 'sh-3',
      name: 'PMR College Flood Shelter Campus',
      distance: '2.6 km',
      address: 'Higher Ground Highway Corridor',
      capacity: '150 / 600 persons',
      facilities: ['Helipad Access Point', 'Field Doctor Clinic', 'Community Kitchen'],
      status: 'Open & Accepting Residents'
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
          Nearby Help & Emergency Contacts
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Find accessible relief shelters, active community kitchens, and direct phone assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {helplines.map((h) => (
          <div key={h.number} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">{h.name}</div>
              <div className="text-xs text-slate-500">{h.desc}</div>
            </div>
            <a
              href={`tel:${h.number}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{h.number}</span>
            </a>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Active Relief Shelters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shelters.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    {s.distance}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{s.address}</span>
                </div>
                <div className="text-xs font-medium text-slate-600 pt-1">
                  Capacity: <span className="font-bold text-slate-900">{s.capacity}</span>
                </div>
                <div className="pt-2 flex flex-wrap gap-1">
                  {s.facilities.map((fac) => (
                    <span key={fac} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CitizenHelpPage;
