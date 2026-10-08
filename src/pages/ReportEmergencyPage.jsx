import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowLeft, 
  RotateCcw
} from 'lucide-react';
import { useDisaster } from '../context/DisasterContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import ReportForm from '../components/reports/ReportForm';
import Button from '../components/ui/Button';

export function ReportEmergencyPage() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { role } = useAuth();
  const [submittedReport, setSubmittedReport] = useState(null);

  const handleReset = () => {
    setSubmittedReport(null);
  };

  const handleDone = () => {
    if (role === ROLES.CITIZEN) {
      navigate('/citizen/dashboard');
    } else {
      navigate('/reports');
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors rounded p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-100 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Report an Emergency
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tell us what is happening.
            </p>
          </div>

          {/* Body: Either Success Screen or Report Form */}
          <div className="p-6 sm:p-8">
            {submittedReport ? (
              /* Success Confirmation Screen (Requirement 9) */
              <div 
                role="status"
                aria-live="polite"
                className="space-y-6 text-center py-4"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    Report received
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Your report has been added to the response team’s list.
                  </p>
                </div>

                {/* Report ID Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-xs mx-auto text-center">
                  <span className="text-xs text-slate-500 block">Report ID</span>
                  <span className="text-base font-bold text-slate-900">{submittedReport.id}</span>
                </div>

                {/* Actions: Done and Submit Another */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    variant="default"
                    size="md"
                    onClick={handleDone}
                    className="w-full sm:w-auto justify-center px-8 cursor-pointer"
                  >
                    Done
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    icon={RotateCcw}
                    onClick={handleReset}
                    className="w-full sm:w-auto justify-center"
                  >
                    Submit another
                  </Button>
                </div>
              </div>
            ) : (
              /* Public Citizen Form */
              <ReportForm onReportSubmitted={(rep) => setSubmittedReport(rep)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportEmergencyPage;
