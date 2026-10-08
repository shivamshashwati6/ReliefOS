import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Inbox, 
  Info,
  Sparkles
} from 'lucide-react';
import { useDisaster } from '../context/DisasterContext';
import { useReports } from '../context/ReportContext';
import ReportCard from '../components/reports/ReportCard';
import ReportFilters from '../components/reports/ReportFilters';
import Button from '../components/ui/Button';

export function ReportsPage() {
  const navigate = useNavigate();
  const { currentDisaster } = useDisaster();
  const { reports, getReportsByDisaster, updateReportStatus } = useReports();

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. DATA ISOLATION: Filter reports belonging strictly to currentDisaster.id
  const disasterReports = useMemo(() => {
    const list = getReportsByDisaster(currentDisaster?.id) || [];
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reports, currentDisaster?.id, getReportsByDisaster]);

  // 2. Compute filter counts
  const counts = useMemo(() => {
    return {
      all: disasterReports.length,
      new: disasterReports.filter((r) => r.status === 'New').length,
      reviewed: disasterReports.filter((r) => r.status === 'Reviewed').length,
    };
  }, [disasterReports]);

  // 3. Apply status filter and search query
  const filteredReports = useMemo(() => {
    return disasterReports.filter((r) => {
      const matchesFilter =
        activeFilter === 'All' || r.status === activeFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.contact && r.contact.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [disasterReports, activeFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Emergency Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Incoming citizen reports for {currentDisaster.name} ({currentDisaster.region})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="md"
            icon={Plus}
            onClick={() => navigate('/report-emergency')}
          >
            Submit Report
          </Button>
        </div>
      </div>

      {/* AI Assistance Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-blue-950">
            AI Summary Assistance
          </div>
          <p className="text-blue-800 leading-relaxed">
            Click "Generate Summary" on any emergency report to extract key details. AI helps organize information, but final decisions should always be reviewed by a human.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ReportFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        counts={counts}
      />

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onToggleStatus={updateReportStatus}
            />
          ))
        ) : (
          <div className="p-12 text-center rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">
                No reports found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? `No emergency reports match the search query "${searchTerm}".`
                  : activeFilter !== 'All'
                  ? `No reports currently categorized under "${activeFilter}".`
                  : `No citizen reports have been received yet for ${currentDisaster.name}.`}
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-medium text-blue-600 hover:underline pt-2 inline-block"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
