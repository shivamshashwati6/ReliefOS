import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, PhoneCall, ArrowLeft, AlertTriangle, Home } from 'lucide-react';
import { useReliefShelter } from '../context/ReliefShelterContext';
import { useDisaster } from '../context/DisasterContext';
import { SHELTER_SAFETY_DISCLAIMER } from '../models/reliefShelter';

export function CitizenHelpPage() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { shelters, calculateRemainingCapacity } = useReliefShelter();

  const helplines = [
    { name: 'National Emergency Service', number: '112', desc: 'Police, Fire and Ambulance emergency response' },
    { name: 'Disaster Helpline', number: '1070', desc: 'State Disaster Management Authority helpline' },
    { name: 'Emergency Medical Service', number: '108', desc: 'Medical transport and field paramedic ambulance' },
    { name: 'District Control Room', number: '03678-240225', desc: 'Emergency Operations Center dispatch desk' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/citizen/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Citizen Portal</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Nearby Help & Emergency Contacts
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Emergency telephone helplines and simulated community relief points for {currentDisaster?.name || 'Active Disaster'}.
        </p>
      </div>

      {/* Emergency Helplines Grid */}
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

      {/* Simulated Relief Points Section with Mandatory Safety Disclaimer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            <span>Community Relief Points (Simulated)</span>
          </h2>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 w-fit">
            Prototype Data
          </span>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-amber-950 font-bold">{SHELTER_SAFETY_DISCLAIMER}</strong>
            <span className="text-amber-800 text-[11px]">
              These relief points represent simulated models for planning exercises. Do not travel to unverified facilities without confirmation from local emergency personnel.
            </span>
          </div>
        </div>

        {shelters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">No simulated shelter points have been configured for this disaster.</p>
            <p className="text-[11px] text-slate-400">Shelter modeling data is isolated per active disaster event.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {shelters.map((s) => {
              const remaining = calculateRemainingCapacity(s);

              return (
                <div key={s.shelterId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                        Simulated Point
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.area} • Schematic location for operational modeling</span>
                    </div>

                    <div className="text-xs text-slate-600 pt-1 flex items-center gap-2">
                      <span>Simulated Capacity: <strong>{s.capacity}</strong></span>
                      <span>•</span>
                      <span>Current: <strong>{s.occupancy}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{remaining} available</span>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {s.services.map((svc, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                    ID: {s.shelterId} • Status: {s.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CitizenHelpPage;
