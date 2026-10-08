import React from 'react';
import { ArrowLeft, Layers } from 'lucide-react';
import Button from '../ui/Button';

export function ModulePlaceholder({ moduleId, onReturnHome }) {
  const titles = {
    'reports': 'Reports',
    'zones': 'Zones',
    'resources': 'Resources',
    'response-plans': 'Response Plans',
    'simulation-lab': 'Simulation',
    'emergency-report': 'Report Emergency',
    'settings': 'Settings',
  };

  const title = titles[moduleId] || 'Module';

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-5 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <Layers className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-slate-900">
          {title}
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          This section is currently in simulation mode. Core operations can be viewed on the dashboard.
        </p>
      </div>

      <div className="pt-2">
        <Button
          variant="default"
          size="md"
          icon={ArrowLeft}
          onClick={onReturnHome}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default ModulePlaceholder;
