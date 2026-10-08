import React, { createContext, useContext, useState } from 'react';
import { useDisaster } from './DisasterContext';

// Initial sample reports for default disaster DISASTER-001 so the dashboard is immediately demonstrable
const INITIAL_REPORTS = [
  {
    id: "REPORT-0001",
    disasterId: "DISASTER-001",
    description: "Water level rose 2 feet inside ground floor houses near the primary school. Three elderly people need assistance moving to higher ground.",
    location: "Morigaon Sector 4, near Primary School",
    contact: "+91 98765 43210",
    photoName: "flooded_street_sector4.jpg",
    status: "New",
    isSimulated: true,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    aiProcessed: false,
    aiAnalysis: null,
    aiStatus: "Pending AI Analysis",
    aiError: null
  },
  {
    id: "REPORT-0002",
    disasterId: "DISASTER-001",
    description: "Main connecting culvert on Route A is completely submerged. Water current is strong, light vehicles unable to cross.",
    location: "KM 42 corridor, Nagaon link road",
    contact: "",
    photoName: "",
    status: "New",
    isSimulated: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    aiProcessed: false,
    aiAnalysis: null,
    aiStatus: "Pending AI Analysis",
    aiError: null
  },
  {
    id: "REPORT-0003",
    disasterId: "DISASTER-001",
    description: "Drinking water borehole contaminated by silt overflow. 40 families in the relief shelter need fresh water supply.",
    location: "Community Center Shelter B",
    contact: "+91 94321 09876",
    photoName: "shelter_water_issue.jpg",
    status: "Reviewed",
    isSimulated: true,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    aiProcessed: false,
    aiAnalysis: null,
    aiStatus: "Pending AI Analysis",
    aiError: null
  }
];

const ReportContext = createContext(null);

export function ReportProvider({ children }) {
  const { currentDisaster } = useDisaster();
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const addReport = (reportData) => {
    // Determine next sequential ID based on existing reports
    const maxNum = reports.reduce((max, r) => {
      const match = r.id && String(r.id).match(/REPORT-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextSeq = maxNum + 1;
    const newReport = {
      id: `REPORT-${String(nextSeq).padStart(4, '0')}`,
      disasterId: reportData.disasterId || (currentDisaster ? currentDisaster.id : "DISASTER-001"),
      description: reportData.description.trim(),
      location: (reportData.location || '').trim(),
      contact: (reportData.contact || '').trim(),
      photoName: reportData.photoName || '',
      status: "New",
      isSimulated: true,
      createdAt: new Date().toISOString(),
      aiProcessed: false,
      aiAnalysis: null,
      aiStatus: "Pending AI Analysis",
      aiError: null
    };

    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  const getReportsByDisaster = (disasterId) => {
    const targetId = disasterId || (currentDisaster ? currentDisaster.id : null);
    if (!targetId) return [];
    return reports.filter((r) => r.disasterId === targetId);
  };

  const updateReportStatus = (reportId, newStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );
  };

  const updateReportAiAnalysis = (reportId, analysisData) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              aiProcessed: true,
              aiAnalysis: analysisData,
              aiStatus: 'Analysis Complete',
              aiError: null
            }
          : r
      )
    );
  };

  const setReportAiLoading = (reportId, isLoading) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              aiStatus: isLoading ? 'Analyzing...' : r.aiStatus
            }
          : r
      )
    );
  };

  const setReportAiError = (reportId, errorMessage) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              aiProcessed: false,
              aiStatus: 'Analysis Failed',
              aiError: errorMessage || 'AI analysis is temporarily unavailable.'
            }
          : r
      )
    );
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        addReport,
        getReportsByDisaster,
        updateReportStatus,
        updateReportAiAnalysis,
        setReportAiLoading,
        setReportAiError
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}

export default ReportContext;
