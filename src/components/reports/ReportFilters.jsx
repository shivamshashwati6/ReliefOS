import React from 'react';
import { Search, X } from 'lucide-react';

export function ReportFilters({
  activeFilter = 'All',
  onFilterChange,
  searchTerm = '',
  onSearchChange,
  counts = { all: 0, new: 0, reviewed: 0 }
}) {
  const filterOptions = [
    { id: 'All', label: 'All', count: counts.all },
    { id: 'New', label: 'New', count: counts.new },
    { id: 'Reviewed', label: 'Reviewed', count: counts.reviewed },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search reports by location or keywords..."
          className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 self-start sm:self-auto">
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{opt.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-semibold ${
                isActive ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
              }`}>
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ReportFilters;
